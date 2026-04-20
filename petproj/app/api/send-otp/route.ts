/**
 * @swagger
 * /api/send-otp:
 *   post:
 *     summary: Send OTP to email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */

import { prisma } from "@/prisma/index";
import bcrypt from 'bcryptjs';
import Mailjet from "node-mailjet";
import { rateLimit } from "@/utils/rateLimit";
const mailjetClient = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY!,
  process.env.MAILJET_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ message: "Email is required" }), { status: 400 });
    }

    // Rate limiting: 3 OTPs per minute
    const limiter = await rateLimit(`otp:${email}`, 3, 60);
    if (!limiter.success) {
      return new Response(JSON.stringify({ message: "Too many OTP requests. Please wait a minute." }), { status: 429 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return new Response(JSON.stringify({ message: "Email already registered" }), { status: 409 });
    }

    await prisma.oTP.upsert({
      where: { email },
      update: { otp: hashedOtp, createdat: new Date(), attempts: 0 },
      create: { email, otp: hashedOtp },
    });

    await mailjetClient.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: { Email: process.env.MAILJET_FROM_EMAIL!, Name: "Paltuu" },
          To: [{ Email: email }],
          Subject: "Your OTP Code",
          TextPart: `Your OTP code is: ${otp}`,
        },
      ],
    });

    return new Response(JSON.stringify({ message: "OTP Sent" }), { status: 200 });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return new Response(JSON.stringify({ message: "Failed to Send OTP" }), { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
