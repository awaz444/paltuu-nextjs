// utils/guest.ts
import { v4 as uuidv4 } from "uuid";

const GUEST_SESSION_KEY = "guest_session_id";

/** Ensure a guest session_id exists in localStorage, return it */
export function getOrCreateGuestSessionId(): string {
  if (typeof window === "undefined") return "";
  
  let token = localStorage.getItem(GUEST_SESSION_KEY);
  if (!token) {
    token = uuidv4(); // generate random unique id
    localStorage.setItem(GUEST_SESSION_KEY, token);
  }
  return token;
}

/** Get guest session_id without creating new one (optional use case) */
export function getGuestSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GUEST_SESSION_KEY);
}

/** Clear guest session (e.g. on logout if you want fresh session) */
export function clearGuestSessionId() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(GUEST_SESSION_KEY);
  }
}
