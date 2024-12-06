import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { createClient } from "../../../../db";

export async function POST(request: Request) {
    const client = createClient();

    try {
        // Connect to the database first
        await client.connect();
        console.log("Connected to database");

        const { email } = await request.json();
        console.log("Email:", email);

        // Check if the email exists
        const userQuery = "SELECT user_id FROM users WHERE email = $1";
        console.log("Executing query...");
        const userResult = await client.query(userQuery, [email]);

        if (userResult.rows.length === 0) {
            return new Response(
                JSON.stringify({ error: "Email not registered." }),
                { status: 404 }
            );
        }

        console.log("User found");
        const userId = userResult.rows[0].user_id; // Fetching the actual userId from the database

        // Generate JWT for password reset
        const resetToken = jwt.sign(
            { userId, email },
            process.env.JWT_SECRET!, // Secret key for signing the token
            { expiresIn: "1h" } // Token valid for 1 hour
        );

        // Send email with reset link
        const transporter = nodemailer.createTransport({
            host: "smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASS,
            },
        });

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        await transporter.sendMail({
            from: "petpostgres@gmail.com",
            to: email,
            subject: "Reset Password",
            html: `<p>You requested a password reset. Click the link below to reset your password:</p>
                   <a href="${resetLink}">Reset Password</a>
                   <p>This link is valid for 1 hour.</p>`,
        });

        return new Response(
            JSON.stringify({ success: true, message: "Password reset email sent." }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Forgot Password Error:", error);
        return new Response(
            JSON.stringify({ error: "Error processing request." }),
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}