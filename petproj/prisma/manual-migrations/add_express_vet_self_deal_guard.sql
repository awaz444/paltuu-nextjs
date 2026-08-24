-- ─────────────────────────────────────────────────────────────────────────────
-- Vets at Home (Express Vet) — self-dealing guard
-- ─────────────────────────────────────────────────────────────────────────────
-- Problem this solves: a dispatcher account and a pet-owner account can be the
-- same human. Nothing stopped that human from creating a request on one account
-- and then claiming + self-assigning it on the other (farming payouts, fake
-- reviews, gaming job volume). Checking `client_user_id != dispatcher_id` alone
-- is not enough — that only catches the case where they forgot to log out.
--
-- Two tables:
--
-- 1. user_device_account_links — an APPEND-ONLY device↔account graph.
--    user_devices.fcm_token is UNIQUE, and NotificationService.registerDevice
--    does `ON CONFLICT (fcm_token) DO UPDATE SET user_id = ...`, so when a second
--    account signs in on the same handset the first account's ownership is
--    silently overwritten and the link is lost forever. That overwrite is exactly
--    the signal we care about, so we record every (token, user) pair we ever see
--    instead of only the current one. Two user_ids sharing a token here = the
--    same physical device, historically.
--
-- 2. express_vet_self_deal_flags — audit trail. Every detection is written here,
--    whether it blocked the action or was only flagged for review, so abuse
--    patterns stay visible even when the guard let something through.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_device_account_links (
  link_id       BIGSERIAL    PRIMARY KEY,
  fcm_token     VARCHAR(500) NOT NULL,
  user_id       INT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  first_seen_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT user_device_account_links_token_user_key UNIQUE (fcm_token, user_id)
);

CREATE INDEX IF NOT EXISTS idx_udal_user_id   ON user_device_account_links (user_id);
CREATE INDEX IF NOT EXISTS idx_udal_fcm_token ON user_device_account_links (fcm_token);

-- Backfill from whatever ownership user_devices currently reflects, so the guard
-- is not blind to devices registered before this migration ran. This only
-- captures the CURRENT owner of each token (the historical ones are already
-- lost); history accumulates properly from here on.
INSERT INTO user_device_account_links (fcm_token, user_id, first_seen_at, last_seen_at)
SELECT fcm_token, user_id, COALESCE(created_at, now()), COALESCE(updated_at, now())
FROM user_devices
ON CONFLICT (fcm_token, user_id) DO NOTHING;


CREATE TABLE IF NOT EXISTS express_vet_self_deal_flags (
  flag_id       BIGSERIAL   PRIMARY KEY,
  request_id    BIGINT      NOT NULL REFERENCES express_vet_requests(request_id) ON DELETE CASCADE,
  dispatcher_id INT         NOT NULL REFERENCES users(user_id),
  provider_id   BIGINT      REFERENCES express_vet_providers(provider_id),
  -- 'claim' | 'assign' — which step the check ran at.
  stage         VARCHAR(20) NOT NULL,
  -- Which identity signals matched: account | phone | device | provider_link.
  signals       TEXT[]      NOT NULL,
  -- true  = the action was refused,
  -- false = allowed but recorded for review (weaker signals only).
  blocked       BOOLEAN     NOT NULL,
  detail        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evsdf_request_id   ON express_vet_self_deal_flags (request_id);
CREATE INDEX IF NOT EXISTS idx_evsdf_dispatcher   ON express_vet_self_deal_flags (dispatcher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evsdf_created_at   ON express_vet_self_deal_flags (created_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- VoIP push topic per build
-- ─────────────────────────────────────────────────────────────────────────────
-- The APNs topic for a VoIP push is `<bundle id>.voip`. Dev and preview builds use
-- com.paltuu.app.dev / com.paltuu.app.preview, so a single hardcoded APNS_BUNDLE_ID
-- sends every push to the production topic and any non-production dispatcher build just
-- gets a 400 BadTopic — the phone never rings, with no client-side symptom to chase.
-- Recorded per token, since it is a property of the build that registered it.
ALTER TABLE express_vet_dispatcher_status
  ADD COLUMN IF NOT EXISTS bundle_id VARCHAR(100);
