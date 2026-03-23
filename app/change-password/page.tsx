import type { Metadata } from "next";
import Navbar from "@/components/layout/NavbarServer";
import ChangePasswordModal from "@/components/profile/ChangePasswordModal";
import { requireAuth } from "@/lib/session/auth";

export const metadata: Metadata = { title: "เปลี่ยนรหัสผ่าน — Lotto" };

export default async function ChangePasswordPage() {
  const user = await requireAuth();
  const phone = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Navbar balance={user.balance} diamond={user.diamond} userName={user.displayName ?? undefined} userPhone={phone} />
      <ChangePasswordModal hasPassword={!!user} />
    </div>
  );
}
