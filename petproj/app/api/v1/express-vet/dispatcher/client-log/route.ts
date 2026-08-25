import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/client-log:
 *   post:
 *     summary: Report a client-side error from the dispatcher app (V1)
 *     tags: [v1 Express Vet]
 *
 * Deliberately dumb: just puts whatever the client sends into the Vercel function log. Exists
 * for exactly one reason — diagnosing the Android FCM-token-registration failure without
 * physical access to the dispatcher's device. Every failure on that path (getToken(),
 * registerPushToken()) was being swallowed by a silent `.catch(() => {})` in
 * src/context/DispatcherCallProvider.tsx, so nobody remote could ever see why it kept failing.
 * This turns that into a log line visible in Vercel's dashboard instead of adb/logcat.
 */
export async function POST(req: NextRequest) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const dispatcherId = Number(dispatcher.id || dispatcher.user_id);
    console.error(
      `📱 [Dispatcher client-log] dispatcher=${dispatcherId} context=${body?.context ?? "unknown"} message=${body?.message ?? ""}`,
      body?.extra ?? {}
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("express-vet dispatcher/client-log POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
