import type { Metadata } from "next";
import Navbar from "@/components/layout/NavbarServer";
import CompleteProfileModal from "@/components/profile/CompleteProfileModal";
import RefreshButton from "@/components/dashboard/RefreshButton";
import { requireAuth } from "@/lib/session/auth";
import { logoutAction } from "@/lib/actions";
import { getUserStats } from "@/lib/db/stats";
import { getBetHistory } from "@/lib/db/bets";
import { getBanks } from "@/lib/db/users";
import LastUpdated from "@/components/ui/LastUpdated";

export const metadata: Metadata = { title: "ข้อมูลสมาชิก — Lotto" };

/** Format 10-digit phone → 0XX-XXX-XXXX */
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}


const menuSections = [
  {
    title: "บัญชีของฉัน",
    items: [
      { icon: "📋", label: "โพยหวย",          desc: "ดูโพยและผลการแทงทั้งหมด", href: "/history" },
      { icon: "💳", label: "ประวัติการเงิน", desc: "รายการฝาก-ถอนทั้งหมด",    href: "/transactions" },
      { icon: "💰", label: "เติมเงิน",        desc: "เพิ่มยอดเงินในบัญชี",      href: "/deposit" },
    ],
  },
  {
    title: "ตั้งค่า",
    items: [
      { icon: "🔐", label: "เปลี่ยนรหัสผ่าน", desc: "อัปเดตรหัสผ่านของคุณ",         href: "/change-password" },
      { icon: "🔔", label: "การแจ้งเตือน",     desc: "จัดการการแจ้งเตือน SMS / แอป", href: "/notifications" },
      { icon: "🛡️", label: "ความปลอดภัย",     desc: "ตรวจสอบการเข้าสู่ระบบ",        href: "/security" },
    ],
  },
];

export default async function ProfilePage() {
  const user = await requireAuth();
  const [stats, { slips: betHistory }, banks] = await Promise.all([
    getUserStats(user.id),
    getBetHistory(user.id, { limit: 5 }),
    getBanks(),
  ]);

  const displayName = user.displayName ?? "สมาชิก";
  const phone       = formatPhone(user.phone);

  const statCards = [
    { label: "ยอดแทงรวม",   value: `฿${stats.totalBet.toFixed(2)}`,  icon: "🎯", color: "text-ap-blue"   },
    { label: "ยอดชนะรวม",   value: `฿${stats.totalWin.toFixed(2)}`,  icon: "🏆", color: "text-ap-green"  },
    { label: "ระดับสมาชิก", value: user.level,                        icon: "⭐", color: "text-ap-orange" },
  ];

  const needsProfile = !user.bankAccount;
  const referralCode = user.referralCode ?? ("LT" + user.id.replace(/-/g, "").slice(0, 6).toUpperCase());

  /** Mask bank account: show only last 4 digits */
  function maskAccount(acc: string) {
    return acc.length > 4 ? `${"X".repeat(acc.length - 4)}-${acc.slice(-4)}` : acc;
  }

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <CompleteProfileModal open={needsProfile} firstname={user.firstname} lastname={user.lastname} banks={banks} />
      <Navbar balance={user.balance} diamond={user.diamond} userName={displayName} userPhone={phone} />

      <div className="max-w-2xl mx-auto px-5 pt-6 space-y-5">

        {/* Balance Card */}
        <div className="bg-ap-blue rounded-3xl overflow-hidden relative">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -right-4 -bottom-10 w-32 h-32 rounded-full bg-white/5" />

          {/* Header */}
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
                <h3 className="sm:ml-auto text-white font-bold text-[18px] truncate">
                  {user.displayName}
                </h3>
              )}
            </div>
          </div>

          {/* Updated time */}
          <div className="relative px-4 pb-3">
            <LastUpdated />
          </div>

          {/* 4-quadrant grid */}
          <div className="relative grid grid-cols-2" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
            {/* Center refresh button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <RefreshButton />
            </div>

            {/* Top-left: เครดิต */}
            <div className="p-4 flex flex-col items-center justify-center gap-0.5" style={{ borderRight: "1px solid rgba(255,255,255,0.15)", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-white text-[20px] font-bold tabular-nums">{user.balance.toFixed(2)}</span>
              <span className="text-white/70 text-[11px]">เครดิต</span>
            </div>

            {/* Top-right: Diamond */}
            <div className="p-4 flex flex-col items-center justify-center gap-0.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-white text-[20px] font-bold tabular-nums">💎 {user.diamond}</span>
              <span className="text-white/70 text-[11px]">Diamond</span>
            </div>

            {/* Bottom-left: คืนยอดเสีย */}
            <div className="p-4 flex flex-col items-center justify-center gap-0.5" style={{ borderRight: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-white text-[20px] font-bold tabular-nums">0.00</span>
              <span className="text-white/70 text-[11px]">คืนยอดเสีย</span>
            </div>

            {/* Bottom-right: แนะนำ / ยอดเดือนนี้ */}
            <div className="p-4 flex flex-col items-center justify-center gap-0.5">
              <span className="text-white/70 text-[14px]">แนะนำ <span className="text-white font-bold">{stats.referredCount}</span></span>
              <span className="text-white/70 text-[14px]">ยอดเดือนนี้ <span className="text-white font-bold">{stats.monthlyReferral.toFixed(2)}</span></span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-ap-border shadow-card text-center">
              <div className="text-[22px] mb-1.5">{s.icon}</div>
              <div className={`text-[16px] font-bold tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-ap-tertiary mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bank account */}
        <div className="bg-white rounded-2xl border border-ap-border shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-ap-tertiary uppercase tracking-wide font-medium mb-1">บัญชีธนาคาร</p>
              {user.bankAccount ? (
                <>
                  <p className="text-[15px] font-semibold text-ap-primary">{user.bankName}</p>
                  <p className="text-[13px] text-ap-secondary font-mono mt-0.5">{maskAccount(user.bankAccount)}</p>
                </>
              ) : (
                <p className="text-[13px] text-ap-tertiary">ยังไม่ได้ผูกบัญชี</p>
              )}
            </div>
            <div className="w-11 h-11 rounded-2xl bg-ap-blue/8 flex items-center justify-center text-[22px]">
              🏦
            </div>
          </div>
             <div className="grid grid-cols-2 gap-2.5 mt-3" >
            <a href="/deposit"
              className="flex items-center justify-center gap-2 bg-ap-blue text-white rounded-full py-2.5 text-[13px] font-semibold hover:bg-ap-blue-h transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              เติมเงิน
            </a>
            <a href="/withdraw"
              className="flex items-center justify-center gap-2 bg-ap-red text-white rounded-full py-2.5 text-[13px] font-semibold hover:opacity-90 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 19V5M5 12h14" strokeLinecap="round" transform="rotate(90 12 12)" />
              </svg>
              ถอนเงิน
            </a>
          </div>
        </div>

        {/* Balance widget */}
        {/* <div className="bg-white rounded-2xl border border-ap-border shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[12px] text-ap-tertiary uppercase tracking-wide font-medium">ยอดคงเหลือ</p>
              <p className="text-[32px] font-bold text-ap-primary tabular-nums mt-0.5">
                ฿<span>{user.balance.toFixed(2)}</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-ap-green/10 flex items-center justify-center">
              <span className="text-[22px]">💰</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <a href="/deposit"
              className="flex items-center justify-center gap-2 bg-ap-blue text-white rounded-full py-2.5 text-[13px] font-semibold hover:bg-ap-blue-h transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              เติมเงิน
            </a>
            <a href="/withdraw"
              className="flex items-center justify-center gap-2 bg-ap-red text-white rounded-full py-2.5 text-[13px] font-semibold hover:opacity-90 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 19V5M5 12h14" strokeLinecap="round" transform="rotate(90 12 12)" />
              </svg>
              ถอนเงิน
            </a>
          </div>
        </div> */}

        {/* Referral card */}
        <a href="/referral" className="block bg-gradient-to-br from-orange-500 to-amber-400 rounded-2xl p-5 text-white relative overflow-hidden group hover:opacity-95 transition-opacity">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[22px]">🎁</span>
                <span className="text-[16px] font-bold tracking-tight">แนะนำเพื่อน</span>
                <span className="text-[10px] font-bold bg-white/25 rounded-full px-2 py-0.5 border border-white/30">ใหม่</span>
              </div>
              <p className="text-[13px] text-white/80 mb-2">รับโบนัสทุกครั้งที่เพื่อนแทง</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] bg-white/20 rounded-lg px-2.5 py-1 font-mono font-bold tracking-widest border border-white/20">
                  {referralCode}
                </span>
                <span className="text-[12px] text-white/70">รหัสของคุณ</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="text-[36px]">👥</div>
              <span className="text-[11px] text-white/80 font-medium">ดูรายละเอียด →</span>
            </div>
          </div>
        </a>

        {/* ประวัติการแทงล่าสุด */}
        <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-ap-border flex items-center justify-between">
            <p className="text-[14px] font-bold text-ap-primary">📋 ประวัติการแทงล่าสุด</p>
            <a href="/history" className="text-[12px] text-ap-blue font-semibold hover:underline">ดูทั้งหมด →</a>
          </div>
          {betHistory.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[13px] text-ap-tertiary">ยังไม่มีประวัติการแทง</p>
            </div>
          ) : (
            <div className="divide-y divide-ap-border">
              {betHistory.map((slip) => {
                const statusStyle: Record<string, string> = {
                  confirmed: "bg-ap-blue/10 text-ap-blue",
                  won:       "bg-ap-green/10 text-ap-green",
                  lost:      "bg-ap-red/10 text-ap-red",
                  pending:   "bg-yellow-50 text-yellow-700",
                  cancelled: "bg-ap-bg text-ap-tertiary",
                  refunded:  "bg-ap-bg text-ap-secondary",
                };
                const statusLabel: Record<string, string> = {
                  confirmed: "ยืนยัน", won: "ถูกรางวัล", lost: "ไม่ถูก",
                  pending: "รอยืนยัน", cancelled: "ยกเลิก", refunded: "คืนเงิน",
                };
                const date = slip.createdAt.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "2-digit" });
                const time = slip.createdAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={slip.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-bold text-ap-primary">{slip.lotteryName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle[slip.status] ?? "bg-ap-bg text-ap-secondary"}`}>
                          {statusLabel[slip.status] ?? slip.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-ap-tertiary">{date} {time} · {slip.itemCount} รายการ · #{slip.slipNo}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[14px] font-bold text-ap-primary tabular-nums">฿{slip.totalAmount.toLocaleString("th-TH")}</p>
                      {slip.status === "won" && (
                        <p className="text-[11px] font-bold text-ap-green tabular-nums">+฿{slip.totalPayout.toLocaleString("th-TH")}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Menu sections */}
        {menuSections.map((section) => (
          <div key={section.title} className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
            <div className="px-5 py-3 border-b border-ap-border">
              <p className="text-[12px] font-semibold text-ap-tertiary uppercase tracking-wide">{section.title}</p>
            </div>
            <div className="divide-y divide-ap-border">
              {section.items.map((item) => (
                <a key={item.href} href={item.href}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-ap-bg/60 transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-ap-bg flex items-center justify-center text-[18px] flex-shrink-0 group-hover:bg-ap-blue/5 transition-colors">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-ap-primary">{item.label}</p>
                    <p className="text-[12px] text-ap-tertiary mt-0.5">{item.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-ap-tertiary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
          <form action={logoutAction}>
            <button type="submit"
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-ap-red/5 transition-colors text-left">
              <div className="w-9 h-9 rounded-xl bg-ap-red/8 flex items-center justify-center text-[18px] flex-shrink-0">
                🚪
              </div>
              <span className="text-[14px] font-semibold text-ap-red">ออกจากระบบ</span>
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-ap-tertiary pb-2">
          เวอร์ชัน 1.0.0 · ข้อมูลปลอดภัยด้วย SSL 256-bit
        </p>
      </div>
    </div>
  );
}
