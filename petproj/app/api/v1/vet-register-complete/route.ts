import { db } from "@/db/index";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/utils/rateLimit";
import { hasSevereIdentityMatch } from "@/lib/moderation/badWords";
import { captureServerEvent } from "@/lib/analytics/serverEvents";
import { notifySignup } from "@/lib/whatsappNotify";
import { normalizePhone, isValidPhone } from "@/utils/phone";
import { VET_QUALIFICATIONS } from "@/lib/vetQualifications";

/**
 * @swagger
 * /api/v1/vet-register-complete:
 *   post:
 *     summary: Vet self-signup from /vet-register (V1)
 *     description: Creates the vet's account and an inactive vet profile. Requires the email OTP from /api/v1/auth/send-otp. An admin approves the vet in /manage-clinics.
 *     tags: [v1 Professional]
 */

// PALTU-146. The /vet-register form posted here for months, but the route was
// dropped when the APIs moved to /api/v1, so every vet signup failed. The old
// route also wrote to tables production no longer has (vet_qualifications,
// vet_specializations, vet_availability, vets.clinic_name...). This one writes
// only the current schema:
//   users: the vet's login (role 'vet'), phone, city, photo
//   vets:  fee, contact number, bio, and qualifications / specialization /
//          schedule as text (the fields admins edit in /manage-clinics)
// The profile is saved with is_active = false, so it stays off every public
// page until an admin approves it in /manage-clinics.

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const OTP_TTL_MS = 10 * 60 * 1000;

const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function fail(status: number, error: string, message: string) {
    return NextResponse.json({ error, message }, { status });
}

/** "17:30" -> "5:30 PM", "09:00" -> "9 AM" */
function formatTime(hhmm: string): string {
    const [h, m] = hhmm.split(":").map(Number);
    const hour = h % 12 || 12;
    const suffix = h < 12 ? "AM" : "PM";
    return m ? `${hour}:${String(m).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}

export async function POST(req: NextRequest) {
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return fail(400, "INVALID_BODY", "Something went wrong. Please try again.");
    }

    // ── Account (step 1 of the form) ─────────────────────────────────────
    const firstName = str(body.firstName);
    const lastName = str(body.lastName);
    const name = `${firstName} ${lastName}`.trim();
    const email = str(body.email).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const otp = str(body.otp);
    const phoneRaw = str(body.phoneNumber);
    const city = str(body.city);

    if (!firstName || !lastName || name.length > 100) return fail(400, "INVALID_NAME", "Please enter your first and last name.");
    if (hasSevereIdentityMatch(name)) return fail(400, "INVALID_NAME", "Please choose a different name.");
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 255) return fail(400, "INVALID_EMAIL", "Please enter a valid email address.");
    if (password.length < 8) return fail(400, "INVALID_PASSWORD", "Your password must be at least 8 characters.");
    if (!phoneRaw || !isValidPhone(phoneRaw)) return fail(400, "INVALID_PHONE", "Please enter a valid phone number.");
    if (!city || city.length > 100) return fail(400, "INVALID_CITY", "Please enter your city.");
    if (!/^\d{6}$/.test(otp)) return fail(400, "INVALID_CODE", "Enter the 6-digit code we emailed you.");
    const phone = normalizePhone(phoneRaw);

    // ── Profile (step 2) ─────────────────────────────────────────────────
    const clinicName = str(body.clinicName);
    const clinicLocation = str(body.clinicLocation);
    const fee = Number(body.consultationFee);
    const contactRaw = str(body.contactNumber);
    const bio = str(body.bio);
    const imageUrl = str(body.imageUrl);

    if (!clinicName || clinicName.length > 150) return fail(400, "INVALID_CLINIC", "Please enter your clinic name.");
    if (!clinicLocation || clinicLocation.length > 200) return fail(400, "INVALID_CLINIC", "Please enter your clinic location.");
    if (!Number.isFinite(fee) || fee <= 0 || fee > 1_000_000) return fail(400, "INVALID_FEE", "Please enter a valid consultation fee.");
    if (!contactRaw || contactRaw.length > 255) return fail(400, "INVALID_CONTACT", "Please enter a contact number.");
    if (!bio || bio.length > 2000) return fail(400, "INVALID_BIO", "Please write a short bio (up to 2000 characters).");
    const contactDetails = (isValidPhone(contactRaw) && normalizePhone(contactRaw)) || contactRaw;
    // Only a photo uploaded through /api/v1/upload/vet (an https URL); users.profile_image_url is varchar(255).
    const profileImageUrl = imageUrl.startsWith("https://") && imageUrl.length <= 255 ? imageUrl : null;

    // ── Qualifications (step 3), as text: "DVM (2018)" one per line ──────
    const details = (body.qualificationDetails ?? {}) as Record<string, { yearAcquired?: unknown; note?: unknown }>;
    const pickedQualifications = new Set(Array.isArray(body.selectedQualifications) ? body.selectedQualifications.map(Number) : []);
    const thisYear = new Date().getFullYear();
    const qualifications = VET_QUALIFICATIONS
        .filter((q) => pickedQualifications.has(q.qualification_id))
        .map((q) => {
            const d = details[q.qualification_id] ?? {};
            const year = Number(d.yearAcquired);
            const note = str(d.note).slice(0, 200);
            const yearPart = Number.isInteger(year) && year >= 1950 && year <= thisYear ? ` (${year})` : "";
            return `${q.qualification_name}${yearPart}${note ? `: ${note}` : ""}`;
        })
        .join("\n");
    if (!qualifications) return fail(400, "INVALID_QUALIFICATIONS", "Please select at least one qualification.");

    // ── Specializations (step 4): pet category ids -> "Cats, Dogs" ───────
    const categoryIds = Array.isArray(body.selectedCategories)
        ? body.selectedCategories.map(Number).filter((id) => Number.isInteger(id) && id > 0)
        : [];
    if (categoryIds.length === 0) return fail(400, "INVALID_SPECIALIZATION", "Please select at least one animal you treat.");

    // ── Schedule (step 5), as text the vet page shows under "Working Time" ──
    const slots = (Array.isArray(body.schedules) ? body.schedules : [])
        .map((s) => ({ day: str(s?.day), start: str(s?.startTime), end: str(s?.endTime) }))
        .filter((s) => DAYS.includes(s.day) && TIME.test(s.start) && TIME.test(s.end) && s.start < s.end)
        .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start.localeCompare(b.start));
    if (slots.length === 0) return fail(400, "INVALID_SCHEDULE", "Please add at least one working day and time.");
    const locationLine = clinicLocation.toLowerCase().includes(city.toLowerCase())
        ? `At ${clinicName}, ${clinicLocation}`
        : `At ${clinicName}, ${clinicLocation}, ${city}`;
    const schedule = [locationLine, ...slots.map((s) => `${s.day}: ${formatTime(s.start)} – ${formatTime(s.end)}`)].join("\n");

    try {
        // Same limit as the normal signup; also caps guesses at the emailed code.
        const limiter = await rateLimit(`vet-register:${email}`, 3, 60, { failOpen: false });
        if (!limiter.success) return fail(429, "RATE_LIMITED", "Too many attempts. Please wait a minute and try again.");

        // ── Email code, checked the same way as /api/v1/auth/register ────
        const otpResult = await db.query('SELECT otp, created_at FROM "OTP" WHERE email = $1', [email]);
        const latestOtp = otpResult.rows[otpResult.rows.length - 1];
        if (!latestOtp) return fail(400, "INVALID_CODE", "Please request a new code and try again.");
        if (Date.now() - new Date(latestOtp.created_at).getTime() > OTP_TTL_MS) {
            await db.query('DELETE FROM "OTP" WHERE email = $1', [email]);
            return fail(410, "CODE_EXPIRED", "This code has expired. Tap \"Resend code\" to get a new one.");
        }
        if (!(await bcrypt.compare(otp, latestOtp.otp))) return fail(400, "INVALID_CODE", "That code is not right. Please check your email and try again.");

        const categories = await db.query(
            "SELECT category_name FROM pet_category WHERE category_id = ANY($1::int[]) ORDER BY category_name",
            [categoryIds]
        );
        const specialization = categories.rows.map((r: { category_name: string }) => r.category_name).join(", ");
        if (!specialization) return fail(400, "INVALID_SPECIALIZATION", "Please select at least one animal you treat.");

        const hashedPassword = await bcrypt.hash(password, 10);
        const client = await db.connect();
        let userId: number;
        let vetId: number;
        try {
            await client.query("BEGIN");

            const existing = await client.query("SELECT 1 FROM users WHERE LOWER(email) = $1 LIMIT 1", [email]);
            if ((existing.rowCount ?? 0) > 0) {
                await client.query("ROLLBACK");
                return fail(409, "EMAIL_EXISTS", "This email already has a Paltuu account. Use a different email, or contact us at contact@paltuu.pk.");
            }

            const userRes = await client.query(
                `INSERT INTO users (name, email, password, role, phone_number, city_id, profile_image_url, signup_source, created_at)
                 VALUES ($1, $2, $3, 'vet', $4,
                         (SELECT city_id FROM cities WHERE LOWER(city_name) = LOWER($5) LIMIT 1),
                         $6, 'web', CURRENT_TIMESTAMP)
                 RETURNING user_id`,
                [name, email, hashedPassword, phone, city, profileImageUrl]
            );
            userId = userRes.rows[0].user_id;

            const vetRes = await client.query(
                `INSERT INTO vets (user_id, minimum_fee, contact_details, bio, qualifications, specialization, schedule, is_active, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, false, CURRENT_TIMESTAMP)
                 RETURNING vet_id`,
                [userId, Math.round(fee), contactDetails, bio, qualifications, specialization, schedule]
            );
            vetId = vetRes.rows[0].vet_id;

            // Every account gets this collection at signup (as /api/v1/auth/register does).
            await client.query(
                "INSERT INTO save_collections (user_id, name, is_default) VALUES ($1, 'All Posts', true)",
                [userId]
            );

            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            if ((err as { code?: string }).code === "23505") {
                return fail(409, "EMAIL_EXISTS", "This email already has a Paltuu account. Use a different email, or contact us at contact@paltuu.pk.");
            }
            throw err;
        } finally {
            client.release();
        }

        await db.query('DELETE FROM "OTP" WHERE email = $1', [email]);

        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;
        db.query(
            "INSERT INTO audit_logs (user_id, action, ip_address, user_agent) VALUES ($1, 'signup_web', $2, $3)",
            [userId, ip, req.headers.get("user-agent") || null]
        ).catch((err) => console.error("Vet signup audit log error:", err));

        await captureServerEvent("signup_completed", userId, req, { method: "vet_application" });
        // WhatsApps the team: "New signup on Paltuu: <name> (vet application, approve in Manage Clinics)."
        await notifySignup(userId, "vet application, approve in Manage Clinics");

        return NextResponse.json({ success: true, user_id: userId, vet_id: vetId }, { status: 201 });
    } catch (err) {
        console.error("Vet signup error:", err);
        return fail(500, "SERVER_ERROR", "Something went wrong on our side. Please try again.");
    }
}
