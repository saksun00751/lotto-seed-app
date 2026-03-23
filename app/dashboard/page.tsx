import Link from "next/link";
import Navbar from "@/components/layout/NavbarServer";
import CompleteProfileModal from "@/components/profile/CompleteProfileModal";
import RefreshButton from "@/components/dashboard/RefreshButton";
import LastUpdated from "@/components/ui/LastUpdated";
import { requireAuth } from "@/lib/session/auth";
import { getLotteryCategories } from "@/lib/db/lottery";
import type { Category, SubItem } from "@/lib/categories";
import { getReferralStats, getMonthlyReferralEarning } from "@/lib/db/referrals";
import { getBanks } from "@/lib/db/users";
import type { Metadata } from "next";
import PromoBanner from "@/components/ui/PromoBanner";
import { getPromotions } from "@/lib/db/promotions";

export const metadata: Metadata = { title: "หน้าหลัก — Lotto" };

function StatusBadge({ status }: { status: SubItem["drawStatus"] }) {
  if (status === "resulted")
    return <span className="inline-block rounded-full px-3 py-0.5 text-[11px] font-bold bg-emerald-500 text-white">จ่ายเงินแล้ว</span>;
  if (status === "closed")
    return <span className="inline-block rounded-full px-3 py-0.5 text-[11px] font-bold bg-orange-400 text-white">กำลังออกผล</span>;
  if (status === "open")
    return <span className="inline-block rounded-full px-3 py-0.5 text-[11px] font-bold bg-sky-500 text-white">เปิดรับแทง</span>;
  return <span className="inline-block rounded-full px-3 py-0.5 text-[11px] font-bold bg-gray-300 text-gray-600">รอออกผล</span>;
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const [referralStats, monthlyEarning, banks, categories, promotions] = await Promise.all([
    getReferralStats(user.id),
    getMonthlyReferralEarning(user.id),
    getBanks(),
    getLotteryCategories(),
    getPromotions(),
  ]);

  const needsProfile = !user.bankAccount;
  const phone = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <CompleteProfileModal open={needsProfile} firstname={user.firstname} lastname={user.lastname} banks={banks} />
      <Navbar balance={user.balance} diamond={user.diamond} userName={user.displayName ?? undefined} userPhone={phone} />
      <div className="max-w-5xl mx-auto px-5 pt-6 space-y-8">

        {/* Balance Card */}
        <div className="bg-ap-blue rounded-3xl overflow-hidden relative">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -right-4 -bottom-10 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative flex items-center gap-2.5 px-4 pt-4 pb-2">
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="white">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2.5 flex-1 min-w-0">
              <div className="bg-white/15 rounded-full px-3 py-1 self-start">
                <span className="text-white font-bold text-[18px] tracking-wider tabular-nums">{user.phone}</span>
              </div>
              {user.displayName && (
                <h3 className="sm:ml-auto text-white font-bold text-[18px] truncate">{user.displayName}</h3>
              )}
            </div>
          </div>

          <div className="relative px-4 pb-3">
            <LastUpdated />
          </div>

          <div className="relative grid grid-cols-2" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <RefreshButton />
            </div>
            <div className="p-4 flex flex-col items-center justify-center gap-0.5" style={{ borderRight: "1px solid rgba(255,255,255,0.15)", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-white text-[20px] font-bold tabular-nums">{user.balance.toFixed(2)}</span>
              <span className="text-white/70 text-[11px]">เครดิต</span>
            </div>
            <div className="p-4 flex flex-col items-center justify-center gap-0.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-white text-[20px] font-bold tabular-nums">{user.diamond}</span>
              <span className="text-white/70 text-[11px]">Diamond</span>
            </div>
            <div className="p-4 flex flex-col items-center justify-center gap-0.5" style={{ borderRight: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-white text-[20px] font-bold tabular-nums">0.00</span>
              <span className="text-white/70 text-[11px]">คืนยอดเสีย</span>
            </div>
            <div className="p-4 flex flex-col items-center justify-center gap-0.5">
              <span className="text-white/70 text-[14px]">แนะนำ <span className="text-white font-bold">{referralStats.referredCount}</span></span>
              <span className="text-white/70 text-[14px]">ยอดเดือนนี้ <span className="text-white font-bold">{monthlyEarning.toFixed(2)}</span></span>
            </div>
          </div>
        </div>

        {/* Promotion Banner */}
        <PromoBanner promos={promotions} />

        {/* ผลการออกรางวัล */}
        {categories.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-[17px] font-bold text-ap-primary tracking-tight">🏆 หวยวันนี้</h2>

            {categories.map((cat: Category) => (
              <div key={cat.id} className="rounded-2xl border border-ap-border shadow-card overflow-hidden">

                {/* group header */}
                <div className="bg-gradient-to-r from-ap-blue to-sky-400 px-4 py-2.5 flex items-center gap-2">
                  <span className="text-[18px]">{cat.emoji}</span>
                  <span className="text-white font-bold text-[14px] tracking-tight">{cat.label}</span>
                  <span className="ml-auto text-white/70 text-[11px]">{cat.items.length} รายการ</span>
                </div>

                {/* column headers */}
                <div className="grid grid-cols-[1fr_80px_60px_60px_90px] sm:grid-cols-[1fr_100px_72px_72px_110px] px-3 py-2 bg-gray-50 border-b border-ap-border text-[11px] font-semibold text-ap-tertiary text-center">
                  <span className="text-left">หวย</span>
                  <span>งวด</span>
                  <span>3 ตัวบน</span>
                  <span>2 ตัวล่าง</span>
                  <span>สถานะ</span>
                </div>

                <div className="bg-white">
                  {cat.items.map((item: SubItem) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="grid grid-cols-[1fr_80px_60px_60px_90px] sm:grid-cols-[1fr_100px_72px_72px_110px] px-3 py-2.5 border-b border-ap-border last:border-0 hover:bg-ap-bg transition-colors items-center"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[18px] flex-shrink-0">{item.flag}</span>
                        <span className="text-[12px] font-semibold text-ap-primary truncate">{item.name}</span>
                      </div>
                      <div className="text-center text-[11px] text-ap-secondary tabular-nums">
                        {item.drawDate ?? "—"}
                      </div>
                      <div className="flex justify-center">
                        {item.result?.top3
                          ? <span className="bg-teal-500 text-white text-[13px] font-bold tabular-nums rounded-md px-2 py-0.5">{item.result.top3}</span>
                          : <span className="text-ap-tertiary text-[12px]">—</span>}
                      </div>
                      <div className="flex justify-center">
                        {item.result?.bot2
                          ? <span className="bg-teal-500 text-white text-[13px] font-bold tabular-nums rounded-md px-2 py-0.5">{item.result.bot2}</span>
                          : <span className="text-ap-tertiary text-[12px]">—</span>}
                      </div>
                      <div className="flex justify-center">
                        <StatusBadge status={item.drawStatus} />
                      </div>
                    </Link>
                  ))}
                </div>

              </div>
            ))}
          </section>
        )}

      </div>
    </div>
  );
}
