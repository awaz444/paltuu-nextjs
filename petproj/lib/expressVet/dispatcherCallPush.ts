import { db } from "@/db/index";
import { getMessaging } from "@/lib/notifications/firebase";
import { sendDispatcherVoipPush, ExpressVetVoipPayload } from "./apnsVoipClient";

/**
 * Sends the "phone rings" alert for a new Vets at Home request — separate from, and in
 * addition to, the normal push notification (`ExpressVetNotifications.onNewRequest`) and
 * the socket broadcast. Those two are fine for updating an already-open app; this is the
 * channel that has to work when the dispatcher's app is backgrounded or fully killed:
 *   - iOS: a raw APNs VoIP push -> native app wakeup -> RNCallKeep.displayIncomingCall
 *   - Android: a high-priority, DATA-ONLY FCM message (no `notification` block) -> the
 *     app's background message handler (registered in index.js, works even when killed
 *     via FCM's own headless JS launch) -> RNCallKeep.displayIncomingCall
 * Both land on react-native-callkeep, which hands off to the OS's native call UI — the OS
 * itself keeps that ringing/vibrating until the dispatcher answers or declines, so there's
 * no custom ringtone-loop code to write or to fail silently.
 *
 * Best-effort by design: any failure here (missing token, APNs/FCM error, dispatcher never
 * registered a token yet) must never throw into the request-creation path that calls this.
 */
export async function sendDispatcherCallAlert(
  dispatcherId: number,
  payload: ExpressVetVoipPayload
): Promise<void> {
  try {
    const res = await db.query(
      `SELECT push_platform, voip_push_token, fcm_push_token
       FROM express_vet_dispatcher_status
       WHERE dispatcher_id = $1`,
      [dispatcherId]
    );
    const row = res.rows[0];
    if (!row) return; // dispatcher has never opened the console / registered a token

    if (row.push_platform === "ios" && row.voip_push_token) {
      await sendDispatcherVoipPush(row.voip_push_token, payload);
      return;
    }

    if (row.push_platform === "android" && row.fcm_push_token) {
      const messaging = getMessaging();
      if (!messaging) return; // Firebase not configured in this environment
      await messaging.send({
        token: row.fcm_push_token,
        // Data-only on purpose — a `notification` block would show a normal tray
        // notification instead of silently waking the background handler that
        // triggers the native CallKeep/ConnectionService incoming-call UI.
        data: {
          type: "express_vet_incoming_call",
          request_id: String(payload.request_id),
          category: payload.category,
          client_name: payload.client_name,
          client_photo_url: payload.client_photo_url ?? "",
          address_line: payload.address_line,
          starting_price_pkr: String(payload.starting_price_pkr),
          contact_phone: payload.contact_phone,
        },
        android: {
          priority: "high",
          // TTL 0 — a ringing-call alert that's minutes late is worse than no alert;
          // let it expire rather than arrive after the request was already claimed.
          ttl: 30000,
        },
      });
      return;
    }
  } catch (error) {
    console.error("❌ sendDispatcherCallAlert failed for dispatcher", dispatcherId, error);
  }
}
