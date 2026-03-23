/**
 * lib/session/cookies.ts
 *
 * Thin wrappers around Next.js `cookies()` for reading/writing
 * the session token cookie (HTTP-only, Secure, SameSite=Lax).
 */

import { cookies } from "next/headers";

export const SESSION_COOKIE = "lotto_sid";

const MAX_AGE = Number(process.env.SESSION_MAX_AGE ?? 604800); // 7 days

/** Write session token to the response cookie */
export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
    maxAge:   MAX_AGE,
  });
}

/** Read session token from the request cookie; null if absent */
export async function getSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

/** Clear the session cookie (logout) */
export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
