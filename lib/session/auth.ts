/**
 * lib/session/auth.ts
 *
 * Server-side helper: resolves the current logged-in user from
 * the session cookie, mapped to the `members` table.
 */

import { getSessionToken } from "./cookies";
import { getSession, refreshSession } from "@/lib/db/sessions";
import { findUserById }    from "@/lib/db/users";

export interface AuthUser {
  id:           string;        // String(members.code)
  phone:        string;        // members.tel
  displayName:  string;        // members.name
  firstname:    string;        // members.firstname
  lastname:     string;        // members.lastname
  balance:      number;        // members.balance
  level:        number;        // members.payment_level
  diamond:      number;        // members.diamond
  createdAt:    Date | null;   // members.date_create
  bankName:     string | null; // banks.name_th via members.bank_code
  bankAccount:  string | null; // members.acc_no
  referralCode: string | null; // members.refer
}

/**
 * Returns the authenticated user or null.
 * Call this from any Server Component / Server Action.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const token = await getSessionToken();
    if (!token) return null;

    const session = await getSession(token);
    if (!session) return null;

    // Extend expiry on every request (rolling session)
    await refreshSession(token);

    const m = await findUserById(session.userId);
    if (!m) return null;

    let bankName: string | null = null;
    if (m.bank_code) {
      const { prisma } = await import("@/lib/db/prisma");
      const bank = await prisma.banks.findFirst({
        where:  { code: m.bank_code },
        select: { name_th: true },
      });
      bankName = bank?.name_th ?? null;
    }

    return {
      id:           String(m.code),
      phone:        m.tel,
      displayName:  m.name || m.tel,
      firstname:    m.firstname,
      lastname:     m.lastname,
      balance:      parseFloat(String(m.balance)),
      level:        m.payment_level,
      diamond:      parseFloat(String(m.diamond)),
      createdAt:    m.date_create ?? null,
      bankName,
      bankAccount:  m.acc_no || null,
      referralCode: m.refer || null,
    };
  } catch (error) {
    console.error("Authentication check failed:", error);
    return null;
  }
}

/** Redirect-aware guard — throws NEXT_REDIRECT if unauthenticated */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login?expired=1");
  }
  return user as AuthUser;
}
