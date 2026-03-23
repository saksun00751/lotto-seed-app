/**
 * lib/db/sessions.ts
 * Session create / validate / destroy — stored in members.session_id field.
 * (Single active session per member)
 */

import crypto from "crypto";
import { prisma } from "./prisma";

const SESSION_MAX_AGE_SEC = Number(process.env.SESSION_MAX_AGE ?? 604_800); // 7 days

/** Create a new session for a member; returns the session token */
export async function createSession(
  userId: string,
  _userAgent?: string | null,
  ipAddress?: string | null
): Promise<string> {
  const code      = parseInt(userId, 10);
  const token     = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1_000);

  await prisma.members.update({
    where: { code },
    data: {
      session_id:    token,
      session_ip:    ipAddress ?? "",
      session_limit: expiresAt,
      lastlogin:     new Date(),
    },
  });

  return token;
}

/** Validate a token; returns { userId, expiresAt } or null */
export async function getSession(
  token: string
): Promise<{ userId: string; expiresAt: Date } | null> {
  if (!token) return null;

  const member = await prisma.members.findFirst({
    where: {
      session_id:    token,
      session_limit: { gt: new Date() },
      enable:        "Y",
    },
    select: { code: true, session_limit: true },
  });

  if (!member || !member.session_limit) return null;
  return { userId: String(member.code), expiresAt: member.session_limit };
}

/** Delete a session (logout) */
export async function destroySession(token: string): Promise<void> {
  await prisma.members.updateMany({
    where: { session_id: token },
    data:  { session_id: "", session_limit: null },
  });
}

/** Extend expiry (rolling sessions) */
export async function refreshSession(token: string): Promise<void> {
  const newExpiry = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1_000);
  await prisma.members.updateMany({
    where: { session_id: token },
    data:  { session_limit: newExpiry },
  });
}
