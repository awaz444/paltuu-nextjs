import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req) {
  const { email, otp } = await req.json();

  const storedOtp = await prisma.OTP.findUnique({
    where: { email },
  });

  if (!storedOtp) {
    return new Response(JSON.stringify({ message: "OTP Not Found" }), { status: 400 });
  }

  // Check Expiration (5 mins)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (storedOtp.createdat < fiveMinutesAgo) {
    await prisma.OTP.delete({ where: { email } });
    return new Response(JSON.stringify({ message: "OTP Expired" }), { status: 400 });
  }

  // Check Attempts Limit
  if (storedOtp.attempts >= 3) {
    await prisma.OTP.delete({ where: { email } });
    return new Response(JSON.stringify({ message: "Too Many Attempts, OTP Blocked" }), { status: 400 });
  }

  const isMatch = await bcrypt.compare(otp, storedOtp.otp);
  if (!isMatch) {
    await prisma.OTP.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
    return new Response(JSON.stringify({ message: "Invalid OTP" }), { status: 400 });
  }

  // OTP Verified -> Delete OTP
  await prisma.OTP.delete({ where: { email } });
  return new Response(JSON.stringify({ message: "OTP Verified" }), { status: 200 });
}