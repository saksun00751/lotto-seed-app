import type { Metadata } from "next";
import Navbar from "@/components/layout/NavbarServer";
import DepositPage from "@/components/deposit/DepositPage";
import { requireAuth } from "@/lib/session/auth";

export const metadata: Metadata = { title: "เติมเงิน — Lotto" };

export default async function DepositRoute() {
  const user = await requireAuth();
  const phone = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Navbar balance={user.balance} diamond={user.diamond} userName={user.displayName ?? undefined} userPhone={phone} />
      <DepositPage
        displayName={user.displayName ?? "สมาชิก"}
        bankName={user.bankName}
        bankAccount={user.bankAccount}
        balance={user.balance}
      />
    </div>
  );
}
