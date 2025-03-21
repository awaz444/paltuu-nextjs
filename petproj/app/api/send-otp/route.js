import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import mailjet from "node-mailjet";

const prisma = new PrismaClient();
const mailjetClient = mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);

    await prisma.oTP.upsert({
      where: { email },
      update: { otp: hashedOtp, createdat: new Date(), attempts: 0 },
      create: { email, otp: hashedOtp },
    });

    await mailjetClient.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: { Email: process.env.MAILJET_FROM_EMAIL, Name: "Paltuu" },
          To: [{ Email: email }],
          Subject: "Your OTP Code",
          TextPart: `Your OTP code is: ${otp}`,
        },
      ],
    });

    return res.status(200).json({ message: "OTP Sent" });
  } catch (error) {
    console.error("Mailjet error:", error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
}
