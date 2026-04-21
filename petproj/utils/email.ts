import { sendEmailViaBrevo } from "./mailjet";

/**
 * Generic email sending utility that resolves to the primary delivery service (Brevo)
 * Supports the V1 Auth and Admin suites.
 */
export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text?: string; html: string }) {
    try {
        console.log(`📧 [Email Utility] Dispatching email to: ${to}`);
        return await sendEmailViaBrevo(to, "Paltuu User", subject, html, text);
    } catch (error) {
        console.error("❌ [Email Utility] Failed to send email:", error);
        throw error;
    }
}
