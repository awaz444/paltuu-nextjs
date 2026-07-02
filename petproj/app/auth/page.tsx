import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import AuthPageClient from "./AuthPageClient";

export const dynamic = "force-dynamic";

function getRoleRedirect(role?: string | null) {
  switch (role) {
    case "vet":
      return "/vet-panel";
    case "shop admin":
      return "/shop-panel";
    case "shelter admin":
      return "/rescue-panel";
    case "vendor":
      return "/vendor-panel";
    case "admin":
      return "/admin-panel";
    default:
      return "/browse-pets";
  }
}

export default async function AuthPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect(getRoleRedirect((session.user as any).role));
  }

  const token = cookies().get("token")?.value;
  if (token && process.env.TOKEN_SECRET) {
    try {
      const decoded = jwt.verify(token, process.env.TOKEN_SECRET) as { role?: string };
      redirect(getRoleRedirect(decoded.role));
    } catch {
      // Invalid custom token falls through to the auth page.
    }
  }

  return <AuthPageClient />;
}
