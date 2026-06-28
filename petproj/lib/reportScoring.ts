import { db } from "@/db/index";

// Weighted report scoring + auto-moderation (plan §5). Replaces the legacy
// trg_reports_insert trigger (dropped in db/social_feed_migration.ts).
//
// Call scoreReport(reportId, postId) fire-and-forget from POST /posts/:id/report
// AFTER a *new* report row is inserted. It owns report_count now.

type Id = string | number | bigint;

// ── Settings ──────────────────────────────────────────────────────────────────

export interface SocialFeedSettings {
  auto_quarantine_weighted_threshold: number;
  severity_fast_lane_threshold: number;
  severity_fast_lane_reasons: string[];
  report_burst_count: number;
  report_burst_window_minutes: number;
  min_account_age_days: number;
  min_trusted_reports_for_auto: number;
  quarantine_grace_hours: number;
  report_immunity_hours: number;
  preemptive_block_window_hours: number;
  feed_weight_base: number;
  feed_weight_affinity: number;
  cold_start_interaction_threshold: number;
}

export const DEFAULT_SETTINGS: SocialFeedSettings = {
  auto_quarantine_weighted_threshold: 10,
  severity_fast_lane_threshold: 4.0,
  severity_fast_lane_reasons: ['ANIMAL_ABUSE', 'HATE_SPEECH'],
  report_burst_count: 5,
  report_burst_window_minutes: 30,
  min_account_age_days: 7,
  min_trusted_reports_for_auto: 3,
  quarantine_grace_hours: 1,
  report_immunity_hours: 48,
  preemptive_block_window_hours: 48,
  feed_weight_base: 0.7,
  feed_weight_affinity: 0.3,
  cold_start_interaction_threshold: 10,
};

export async function getReportSettings(): Promise<SocialFeedSettings> {
  try {
    const res = await db.query(
      `SELECT setting_value FROM app_settings WHERE setting_key = 'social_feed_settings'`
    );
    const stored = res.rows[0]?.setting_value;
    if (!stored) return { ...DEFAULT_SETTINGS };
    const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

// ── Trust ceiling (plan §7) ─────────────────────────────────────────────────────

/**
 * Recompute a reporter's trust ceiling after a dismissal.
 *  - 0 dismissals  → 1.0
 *  - 1 dismissal   → soft recovery toward 1.0 over 180 days (floor 0.9)
 *  - 2+ dismissals → 0.9 permanent
 */
export function recomputeTrustCeiling(
  lifetimeDismissals: number,
  lastDismissalAt: Date | null
): number {
  if (lifetimeDismissals === 0) return 1.0;
  if (lifetimeDismissals >= 2) return 0.9;
  if (!lastDismissalAt) return 0.9;
  const daysSince = (Date.now() - lastDismissalAt.getTime()) / 86_400_000;
  return Math.min(1.0, 0.9 + 0.1 * (1 - Math.pow(0.5, daysSince / 180)));
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function daysSince(d: Date | string | null): number {
  if (!d) return Infinity;
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
  return (Date.now() - t) / 86_400_000;
}

function hoursSince(d: Date | string | null): number {
  return daysSince(d) * 24;
}

// ── Main entry ────────────────────────────────────────────────────────────────

/**
 * Compute the weight for a single report, accumulate it on the post, bump
 * report_count, flag preemptive blocks, then evaluate auto-action.
 */
export async function scoreReport(reportId: Id, postId: Id): Promise<void> {
  const settings = await getReportSettings();

  const reportRes = await db.query(
    `SELECT reporter_id, reason_code, created_at FROM reports WHERE report_id = $1`,
    [reportId]
  );
  const report = reportRes.rows[0];
  if (!report) return;

  const postRes = await db.query(
    `SELECT user_id, report_weighted_score FROM social_posts WHERE post_id = $1`,
    [postId]
  );
  const post = postRes.rows[0];
  if (!post) return;

  const reporterRes = await db.query(
    `SELECT created_at, reporter_trust, trust_ceiling FROM users WHERE user_id = $1`,
    [report.reporter_id]
  );
  const reporter = reporterRes.rows[0];
  if (!reporter) return;

  // Age factor
  const accountAgeDays = daysSince(reporter.created_at);
  const a_r = accountAgeDays < 7 ? 0.0 : accountAgeDays < 30 ? 0.5 : 1.0;

  // Trust (clamp to effective ceiling)
  const tau_eff = Math.min(
    Number(reporter.reporter_trust ?? 1.0),
    Number(reporter.trust_ceiling ?? 1.0)
  );

  // Block factor — reporter blocking author halves weight; author blocking
  // reporter does NOT silence the report.
  const reporterBlockedAuthor = await db.query(
    `SELECT 1 FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2 LIMIT 1`,
    [report.reporter_id, post.user_id]
  );
  const authorBlockedReporter = await db.query(
    `SELECT created_at FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2 LIMIT 1`,
    [post.user_id, report.reporter_id]
  );
  const b_r = (reporterBlockedAuthor.rowCount ?? 0) > 0 ? 0.5 : 1.0;

  // Severity
  const s_r = ['ANIMAL_ABUSE', 'HATE_SPEECH'].includes(report.reason_code) ? 1.5 : 1.0;

  const w_r = 1.0 * a_r * tau_eff * b_r * s_r;

  // Persist the computed weight on the report row (never recomputed later).
  await db.query(`UPDATE reports SET report_weight = $1 WHERE report_id = $2`, [w_r, reportId]);

  // Accumulate on the post + take over report_count from the dropped trigger.
  const newScore = Number(post.report_weighted_score ?? 0) + w_r;
  await db.query(
    `UPDATE social_posts
       SET report_weighted_score = $1,
           report_count = COALESCE(report_count, 0) + 1
     WHERE post_id = $2`,
    [newScore, postId]
  );

  // Preemptive-block detection: author blocked the reporter within the window.
  if ((authorBlockedReporter.rowCount ?? 0) > 0) {
    const blockedAt = authorBlockedReporter.rows[0].created_at;
    const windowHours = settings.preemptive_block_window_hours ?? 48;
    if (hoursSince(blockedAt) < windowHours) {
      await db.query(
        `UPDATE social_posts SET author_block_after_report = true WHERE post_id = $1`,
        [postId]
      );
    }
  }

  await evaluateAutoAction(postId, newScore, settings);
}

// ── Auto-action evaluation ──────────────────────────────────────────────────────

async function evaluateAutoAction(
  postId: Id,
  score: number,
  settings: SocialFeedSettings
): Promise<void> {
  const postRes = await db.query(
    `SELECT created_at, suspicious_burst_at, report_immunity_until, moderation_state
       FROM social_posts WHERE post_id = $1`,
    [postId]
  );
  const post = postRes.rows[0];
  if (!post) return;

  // Already actioned — nothing to do.
  if (post.moderation_state === 'quarantined' || post.moderation_state === 'hidden') return;

  // Never auto-quarantine while immunity is active (post-dismissal).
  if (post.report_immunity_until && new Date(post.report_immunity_until) > new Date()) return;

  // Grace window: don't auto-action very fresh posts.
  const graceHours = settings.quarantine_grace_hours ?? 1;
  if (hoursSince(post.created_at) < graceHours) return;

  const reportsRes = await db.query(
    `SELECT reason_code, report_weight, created_at
       FROM reports WHERE target_id = $1 AND target_type = 'post'`,
    [postId]
  );
  const reports = reportsRes.rows;
  const total = reports.length;
  if (total === 0) return;

  // Brigading: burst of reports in a short window → human review, no auto-action.
  const burstMs = (settings.report_burst_window_minutes ?? 30) * 60_000;
  const burstWindow = Date.now() - burstMs;
  const recentCount = reports.filter((r) => new Date(r.created_at).getTime() > burstWindow).length;
  if (recentCount >= (settings.report_burst_count ?? 5)) {
    await db.query(
      `UPDATE social_posts SET suspicious_burst_at = NOW() WHERE post_id = $1`,
      [postId]
    );
    await priorityQueue(postId, 'suspicious_burst');
    return;
  }

  // Brigading: cluster of brand-new accounts.
  const minAge = settings.min_account_age_days ?? 7;
  const newAccountFraction = await getNewAccountFraction(postId, minAge);
  if (newAccountFraction > 0.5) {
    await priorityQueue(postId, 'new_account_cluster');
    return;
  }

  // Brigading: cluster of low-trust reports.
  const lowTrustFraction =
    reports.filter((r) => Number(r.report_weight ?? 0) < 0.5).length / total;
  if (lowTrustFraction > 0.6) {
    await priorityQueue(postId, 'low_trust_cluster');
    return;
  }

  // Need enough trusted reports before any auto-action.
  const trustedReports = reports.filter((r) => Number(r.report_weight ?? 0) >= 0.8);
  if (trustedReports.length < (settings.min_trusted_reports_for_auto ?? 3)) {
    if (trustedReports.length >= 1) await priorityQueue(postId, 'insufficient_trusted');
    return;
  }

  // Severity fast-lane: a trusted, aged report on a severe reason can quarantine
  // earlier — but never while a burst is suspected.
  const fastLaneReasons = settings.severity_fast_lane_reasons ?? ['ANIMAL_ABUSE', 'HATE_SPEECH'];
  const fastLaneThreshold = settings.severity_fast_lane_threshold ?? 4.0;
  const fastLaneEligible = reports.some(
    (r) =>
      fastLaneReasons.includes(r.reason_code) &&
      Number(r.report_weight ?? 0) >= 0.8 &&
      !post.suspicious_burst_at
  );
  if (fastLaneEligible && score >= fastLaneThreshold) {
    await quarantinePost(postId);
    return;
  }

  // Standard threshold.
  if (score >= (settings.auto_quarantine_weighted_threshold ?? 10)) {
    await quarantinePost(postId);
  }
}

async function getNewAccountFraction(postId: Id, minAgeDays: number): Promise<number> {
  const res = await db.query(
    `SELECT AVG(CASE WHEN u.created_at > NOW() - make_interval(days => $2) THEN 1.0 ELSE 0.0 END) AS frac
       FROM reports r
       JOIN users u ON u.user_id = r.reporter_id
      WHERE r.target_id = $1 AND r.target_type = 'post'`,
    [postId, minAgeDays]
  );
  return Number(res.rows[0]?.frac ?? 0);
}

async function quarantinePost(postId: Id): Promise<void> {
  // Quarantined posts stay visible to followers; the global/personalized feed
  // (Pass 2) will exclude them. is_hidden is intentionally left false.
  await db.query(
    `UPDATE social_posts SET moderation_state = 'quarantined' WHERE post_id = $1`,
    [postId]
  );
  await db.query(
    `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
     VALUES (NULL, 'auto_quarantine', $1, 'quarantined')`,
    [`post:${postId}`]
  );
  // TODO (Pass 2): push notification to author.
}

// Pass 1: "priority queue" = a flag log; the admin report queue surfaces these
// via suspicious_burst_at / author_block_after_report sorting.
async function priorityQueue(postId: Id, reason: string): Promise<void> {
  await db.query(
    `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
     VALUES (NULL, $1, $2, 'flagged')`,
    [`priority_queue:${reason}`, `post:${postId}`]
  );
}
