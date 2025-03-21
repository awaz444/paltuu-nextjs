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

    if (!storedOtp || !storedOtp.createdat) {
      return new Response(JSON.stringify({ message: "OTP Not Found or Invalid" }), { status: 400 });
    }

    // Ensure createdat is not null before comparison
    const createdAt = storedOtp.createdat ?? new Date(0);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (createdAt < fiveMinutesAgo) {
      await prisma.oTP.delete({ where: { email } });
      return new Response(JSON.stringify({ message: "OTP Expired" }), { status: 400 });
    }

    // Ensure attempts is not null
    const attempts = storedOtp.attempts ?? 0;

    // Check Attempts Limit
    if (attempts >= 3) {
      await prisma.oTP.delete({ where: { email } });
      return new Response(JSON.stringify({ message: "Too Many Attempts, OTP Blocked" }), { status: 400 });
    }

    // Ensure storedOtp.otp is not null before comparing
    const hashedOtp = storedOtp.otp ?? "";
    const isMatch = await bcrypt.compare(otp, hashedOtp);

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
