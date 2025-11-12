// utils/authClient.ts
// Small client-side helpers to read JWT from cookies and decode payload (no verification)
export function getTokenFromCookie(cookieName = "token"): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp('(^|; )' + cookieName + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function base64UrlDecode(str: string) {
  // Convert from base64url to base64
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  // Pad with '='
  while (str.length % 4) str += "=";
  try {
    return decodeURIComponent(
      atob(str)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  } catch (e) {
    try {
      return atob(str);
    } catch (e2) {
      return "";
    }
  }
}

export function decodeJwtPayload(token: string | null) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1];
    const decoded = base64UrlDecode(payload);
    return JSON.parse(decoded);
  } catch (e) {
    console.error("Failed to decode JWT payload", e);
    return null;
  }
}

export function getUserIdFromToken(cookieName = "token") {
  const token = getTokenFromCookie(cookieName);
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  // Support id or user_id
  return payload.id || payload.user_id || null;
}
