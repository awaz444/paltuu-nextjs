import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { email, otp } = req.body as { email: string; otp: string };

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const storedOtp = await prisma.oTP.findUnique({ where: { email } });

    if (!storedOtp) {
      return res.status(400).json({ message: "OTP Not Found" });
    }

    // Check Expiration (5 mins)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (!storedOtp.createdat || new Date(storedOtp.createdat) < fiveMinutesAgo) {
      await prisma.oTP.delete({ where: { email } });
      return res.status(400).json({ message: "OTP Expired" });
    }

    // Ensure `attempts` is a valid number
    const attempts = storedOtp.attempts ?? 0;

    // Check Attempts Limit
    if (attempts >= 3) {
      await prisma.oTP.delete({ where: { email } });
      return res.status(400).json({ message: "Too Many Attempts, OTP Blocked" });
    }

    const isMatch = await bcrypt.compare(otp, storedOtp.otp);
    if (!isMatch) {
      await prisma.oTP.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP Verified -> Delete OTP
    await prisma.oTP.delete({ where: { email } });

    return res.status(200).json({ message: "OTP Verified" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
