import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import AuthPageClient from "./AuthPageClient";
import { safeCallbackUrl } from "@/lib/authRedirect";

export const dynamic = "force-dynamic";

function getRoleRedirect(role?: string | null) {
  switch (role) {
    case "shop admin":
      return "/shop-panel";
    case "shelter admin":
      return "/rescue-panel";
    case "vendor":
      return "/vendor-panel";
    case "admin":
      return "/admin-panel";
    default:
      return "/home";
  }
}

export default async function AuthPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  // Already logged in (or just back from Google/Apple): go where they were headed.
  const next = safeCallbackUrl(searchParams.callbackUrl);
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect(next ?? getRoleRedirect((session.user as any).role));
  }

  const token = cookies().get("token")?.value;
  if (token && process.env.TOKEN_SECRET) {
    // redirect() works by throwing, so it must stay outside the try.
    let decoded: { role?: string } | null = null;
    try {
      decoded = jwt.verify(token, process.env.TOKEN_SECRET) as { role?: string };
    } catch {
      // Invalid custom token falls through to the auth page.
    }
    if (decoded) redirect(next ?? getRoleRedirect(decoded.role));
  }

  return <AuthPageClient />;
}
