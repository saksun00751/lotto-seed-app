import type { Metadata } from "next";
import SpinPage from "@/components/spin/SpinPage";
import { requireAuth } from "@/lib/session/auth";
import { getBanks } from "@/lib/db/users";

export const metadata: Metadata = { title: "หมุนวงล้อ — Lotto" };

export default async function SpinRoute() {
  const [user, banks] = await Promise.all([requireAuth(), getBanks()]);
  return <SpinPage user={user} banks={banks} />;
}
