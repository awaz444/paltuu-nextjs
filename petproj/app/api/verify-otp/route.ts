import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, otp }: { email: string; otp: string } = await req.json();

    if (!email || !otp) {
      return new Response(JSON.stringify({ message: "Email and OTP are required" }), { status: 400 });
    }

    const storedOtp = await prisma.oTP.findUnique({ where: { email } });

    if (!storedOtp) {
      return new Response(JSON.stringify({ message: "OTP Not Found" }), { status: 400 });
    }

    // Check Expiration (5 mins)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (storedOtp.createdat < fiveMinutesAgo) {
      await prisma.oTP.delete({ where: { email } });
      return new Response(JSON.stringify({ message: "OTP Expired" }), { status: 400 });
    }

    // Check Attempts Limit
    if (storedOtp.attempts >= 3) {
      await prisma.oTP.delete({ where: { email } });
      return new Response(JSON.stringify({ message: "Too Many Attempts, OTP Blocked" }), { status: 400 });
    }

    const isMatch = await bcrypt.compare(otp, storedOtp.otp);
    if (!isMatch) {
      await prisma.oTP.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      return new Response(JSON.stringify({ message: "Invalid OTP" }), { status: 400 });
    }

    // OTP Verified -> Delete OTP
    await prisma.oTP.delete({ where: { email } });

    return new Response(JSON.stringify({ message: "OTP Verified" }), { status: 200 });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}
