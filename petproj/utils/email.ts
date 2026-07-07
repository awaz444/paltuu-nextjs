import nodemailer from "nodemailer";
import { sendEmailViaBrevo } from "./mailjet";

// Configure Zoho SMTP transporter if credentials exist
const transporter = process.env.ZOHO_USER && process.env.ZOHO_PASS
    ? nodemailer.createTransport({
        host: process.env.ZOHO_HOST || "smtp.zoho.com",
        port: parseInt(process.env.ZOHO_PORT || "465"),
        secure: (process.env.ZOHO_PORT || "465") === "465", // true for 465, false for other ports
        auth: {
            user: process.env.ZOHO_USER,
            pass: process.env.ZOHO_PASS,
        },
    })
    : null;

/**
 * Generic email sending utility that resolves to Zoho SMTP (if configured)
 * or falls back to Brevo.
 */
export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text?: string; html: string }) {
    try {
        if (transporter) {
            console.log(`📧 [Email Utility] Dispatching email to: ${to} via Zoho Mail`);
            const mailOptions = {
                from: `"${process.env.EMAIL_SENDER_NAME || 'Paltuu'}" <${process.env.ZOHO_USER}>`,
                to,
                subject,
                text,
                html,
            };
            return await transporter.sendMail(mailOptions);
        } else {
            console.log(`📧 [Email Utility] Dispatching email to: ${to} via Brevo`);
            return await sendEmailViaBrevo(to, "Paltuu User", subject, html, text);
        }
    } catch (error) {
        console.error("❌ [Email Utility] Failed to send email:", error);
        throw error;
    }
}
