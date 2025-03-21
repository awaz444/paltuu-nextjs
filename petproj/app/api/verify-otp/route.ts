import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // Parse JSON body
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ message: "Email and OTP are required" }, { status: 400 });
    }

    const storedOtp = await prisma.oTP.findUnique({ where: { email } });

    if (!storedOtp) {
      return NextResponse.json({ message: "OTP Not Found" }, { status: 400 });
    }

    // Check expiration (5 mins)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (!storedOtp.createdat || new Date(storedOtp.createdat) < fiveMinutesAgo) {
      await prisma.oTP.delete({ where: { email } });
      return NextResponse.json({ message: "OTP Expired" }, { status: 400 });
    }

    // Ensure attempts is a valid number
    const attempts = storedOtp.attempts ?? 0;

    // Check Attempts Limit
    if (attempts >= 3) {
      await prisma.oTP.delete({ where: { email } });
      return NextResponse.json({ message: "Too Many Attempts, OTP Blocked" }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(otp, storedOtp.otp);
    if (!isMatch) {
      await prisma.oTP.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    // OTP Verified -> Delete OTP
    await prisma.oTP.delete({ where: { email } });

    return NextResponse.json({ message: "OTP Verified" }, { status: 200 });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
