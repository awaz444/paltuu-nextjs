import http2 from "http2";
import crypto from "crypto";
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

/**
 * Stable CallKit call UUID for a request.
 *
 * Derived from the request id rather than randomly generated so that a retried or
 * duplicated push maps to the SAME CallKit call — reporting a second uuid for a job the
 * dispatcher is already being rung about would stack a second incoming-call screen on top
 * of the first. Shaped as a v5-style UUID because CallKit parses it with NSUUID and
 * rejects anything that isn't a well-formed UUID (which would leave the PushKit
 * completion handler unfired — see plugins/withVoipPushAppDelegate.js in the app repo).
 */
export function callUuidForRequest(requestId: string | number): string {
  const h = crypto.createHash("sha1").update(`paltuu-express-vet-call:${requestId}`).digest("hex");
  const version = `5${h.slice(13, 16)}`;
  const variant = ((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0");
  return [h.slice(0, 8), h.slice(8, 12), version, `${variant}${h.slice(18, 20)}`, h.slice(20, 32)].join("-");
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
 * plugins/withVoipPushAppDelegate.js + react-native-voip-push-notification). That native
 * handler reports the call to CallKit synchronously, before it completes the push — Apple
 * kills the app, and eventually stops delivering VoIP pushes to it entirely, if a VoIP
 * push doesn't result in an immediate CallKit report. Nothing on the JS side is allowed to
 * be on that path, which is why `uuid` is in the payload: the native layer needs a call
 * identity without waiting to ask JS for one.
 *
 * One HTTP/2 request per call — Apple recommends keeping a connection open and reusing
 * it, which matters at real call volume; at dispatcher-alert volume (a handful of
 * requests per day) a fresh short-lived connection per push is simpler and safer than
 * managing a long-lived client's reconnect/error state across serverless invocations.
 */
export async function sendDispatcherVoipPush(
  voipToken: string,
  payload: ExpressVetVoipPayload,
  /**
   * Bundle id of the build that registered this token. The APNs topic for a VoIP push is
   * `<bundle id>.voip`, and dev/preview builds use com.paltuu.app.dev / .preview — sending
   * every push to the production topic gets a 400 BadTopic and the dispatcher's phone
   * simply never rings. Recorded per token at registration time (see the push-token
   * route); falls back to APNS_BUNDLE_ID for rows registered before that column existed.
   */
  bundleId?: string | null
): Promise<boolean> {
  if (!isConfigured()) return false;

  return new Promise((resolve) => {
    const client = http2.connect(`https://${APNS_HOST}`);

    client.on("error", (err) => {
      console.error("❌ APNs VoIP push connection error:", err);
      resolve(false);
    });

    // `uuid` sits at the TOP level, alongside `expressVet`, because the native
    // PKPushRegistryDelegate reads it straight off payload.dictionaryPayload before it
    // touches the job data.
    const body = JSON.stringify({
      aps: {},
      uuid: callUuidForRequest(payload.request_id),
      expressVet: payload,
    });
    const topicBundleId = bundleId || APNS_BUNDLE_ID;

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${voipToken}`,
      authorization: `bearer ${getProviderToken()}`,
      "apns-topic": `${topicBundleId}.voip`,
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
