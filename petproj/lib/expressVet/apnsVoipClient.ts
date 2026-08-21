import http2 from "http2";
import jwt from "jsonwebtoken";

/**
 * Raw APNs HTTP/2 client for VoIP pushes (Vets at Home dispatcher ringing alert).
 *
 * Built directly on Node's `http2` module rather than the `apn` (node-apn) package —
 * that package's last release (2.2.0, unmaintained) never added support for the
 * `apns-push-type` header, which Apple now requires on every APNs request. Getting that
 * header right is the entire point of this file, so a thin, explicit implementation here
 * is more trustworthy than a stale wrapper that silently omits it.
 *
 * ── Manual setup required before this can send anything (cannot be done from code) ──
 * In the Apple Developer portal (Certificates, Identifiers & Profiles → Keys):
 *   1. Create an APNs Auth Key (.p8) — the token-based method, not a per-app VoIP
 *      Services Certificate (Apple's current recommendation: one key covers VoIP and
 *      normal push, never expires, unlike the old certificate).
 *   2. Note the Key ID (shown when the key is created) and your Team ID (top-right of
 *      the portal).
 *   3. Set the env vars below. APNS_PRODUCTION should be "false" for dev/EAS development
 *      or preview builds (they connect to the sandbox APNs environment) and "true" only
 *      for the production/App Store build.
 */

const APNS_KEY_P8 = process.env.APNS_VOIP_KEY_P8; // full contents of the .p8 file (PEM)
const APNS_KEY_ID = process.env.APNS_KEY_ID;
const APNS_TEAM_ID = process.env.APNS_TEAM_ID;
const APNS_BUNDLE_ID = process.env.APNS_BUNDLE_ID || "com.paltuu.app";
const APNS_PRODUCTION = process.env.APNS_PRODUCTION === "true";
const APNS_HOST = APNS_PRODUCTION ? "api.push.apple.com" : "api.sandbox.push.apple.com";

let warnedOnce = false;
function isConfigured(): boolean {
  const ok = !!(APNS_KEY_P8 && APNS_KEY_ID && APNS_TEAM_ID);
  if (!ok && !warnedOnce) {
    console.warn(
      "⚠️ APNS_VOIP_KEY_P8 / APNS_KEY_ID / APNS_TEAM_ID not set — dispatcher VoIP ringing push is disabled (the normal push notification still sends)."
    );
    warnedOnce = true;
  }
  return ok;
}

// Apple: reuse the same provider token for up to 60 minutes rather than signing a new
// one per request — refreshed a little early here to stay well inside that window.
let cachedToken: { token: string; signedAt: number } | null = null;
const TOKEN_TTL_MS = 50 * 60 * 1000;

function getProviderToken(): string {
  if (cachedToken && Date.now() - cachedToken.signedAt < TOKEN_TTL_MS) {
    return cachedToken.token;
  }
  const token = jwt.sign({ iss: APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) }, APNS_KEY_P8 as string, {
    algorithm: "ES256",
    header: { alg: "ES256", kid: APNS_KEY_ID as string },
  });
  cachedToken = { token, signedAt: Date.now() };
  return token;
}

export interface ExpressVetVoipPayload {
  request_id: string | number;
  category: string;
  client_name: string;
  client_photo_url: string | null;
  address_line: string;
  starting_price_pkr: number;
  contact_phone: string;
}

/**
 * Send a VoIP push that wakes the dispatcher's app in the background (via
 * `pushRegistry(_:didReceiveIncomingPushWith:for:completion:)`, wired up natively by
 * plugins/withVoipPushAppDelegate.js + react-native-voip-push-notification) and must be
 * turned into a RNCallKeep.displayIncomingCall(...) call synchronously on the client —
 * Apple kills the app if a VoIP push doesn't result in an immediate CallKit report.
 *
 * One HTTP/2 request per call — Apple recommends keeping a connection open and reusing
 * it, which matters at real call volume; at dispatcher-alert volume (a handful of
 * requests per day) a fresh short-lived connection per push is simpler and safer than
 * managing a long-lived client's reconnect/error state across serverless invocations.
 */
export async function sendDispatcherVoipPush(
  voipToken: string,
  payload: ExpressVetVoipPayload
): Promise<boolean> {
  if (!isConfigured()) return false;

  return new Promise((resolve) => {
    const client = http2.connect(`https://${APNS_HOST}`);

    client.on("error", (err) => {
      console.error("❌ APNs VoIP push connection error:", err);
      resolve(false);
    });

    const body = JSON.stringify({ aps: {}, expressVet: payload });

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${voipToken}`,
      authorization: `bearer ${getProviderToken()}`,
      "apns-topic": `${APNS_BUNDLE_ID}.voip`,
      "apns-push-type": "voip",
      "apns-priority": "10",
      "apns-expiration": "0",
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body).toString(),
    });

    let responseStatus = 0;
    let responseBody = "";

    req.setEncoding("utf8");
    req.on("response", (headers) => {
      responseStatus = Number(headers[":status"] ?? 0);
    });
    req.on("data", (chunk) => {
      responseBody += chunk;
    });
    req.on("end", () => {
      client.close();
      if (responseStatus !== 200) {
        console.error(`❌ APNs VoIP push failed (${responseStatus}):`, responseBody);
        resolve(false);
        return;
      }
      resolve(true);
    });
    req.on("error", (err) => {
      console.error("❌ APNs VoIP push request error:", err);
      client.close();
      resolve(false);
    });

    req.write(body);
    req.end();
  });
}
