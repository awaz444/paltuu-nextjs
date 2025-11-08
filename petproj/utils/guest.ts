// utils/guest.ts
import { v4 as uuidv4 } from "uuid";

const GUEST_SESSION_KEY = "guest_session_id";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
}

function removeCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=/`;
}

/** Ensure a guest session_id exists (stored in a cookie), return it */
export function getOrCreateGuestSessionId(): string {
  if (typeof window === "undefined") return "";

  let token = readCookie(GUEST_SESSION_KEY);
  if (!token) {
    token = uuidv4(); // generate random unique id
    setCookie(GUEST_SESSION_KEY, token);
  }
  return token;
}

/** Get guest session_id without creating new one (optional use case) */
export function getGuestSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return readCookie(GUEST_SESSION_KEY);
}

/** Clear guest session (e.g. on logout if you want fresh session) */
export function clearGuestSessionId() {
  if (typeof window === "undefined") return;
  removeCookie(GUEST_SESSION_KEY);
}
