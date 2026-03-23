import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/NavbarServer";
import { requireAuth } from "@/lib/session/auth";
import { getCreditLog, getSpinHistory, getBonusLog } from "@/lib/db/transactions";
import type { TxRow } from "@/lib/db/transactions";

export const metadata: Metadata = { title: "ประวัติการเงิน — Lotto" };

// ─── Tab config ────────────────────────────────────────────────────────────
const TABS = [
  { id: "deposit",  label: "ฝาก",            icon: "💰" },
  { id: "withdraw", label: "ถอน",            icon: "💸" },
  { id: "spin",     label: "วงล้อ",          icon: "🎡" },
  { id: "cashback", label: "ยอดเสีย",        icon: "♻️" },
  { id: "downline", label: "ยอดเสียเพื่อน", icon: "👥" },
  { id: "refer",    label: "ค่าแนะนำ",       icon: "🤝" },
  { id: "bonus",    label: "โบนัส",          icon: "🎁" },
  { id: "adjust",   label: "ปรับยอด",        icon: "⚙️" },
];

const TAB_KINDS: Record<string, string[]> = {
  deposit:  ["DEP", "DEPOSIT"],
  withdraw: ["WD", "WITHDRAW"],
  cashback: ["CB", "CASHBACK", "REBATE"],
  downline: ["DOWN", "DOWNLINE"],
  refer:    ["REF", "REFER", "REFERRAL"],
  bonus:    ["BONUS"],
  adjust:   ["ADJ", "ADJUST"],
};

// ─── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TxRow["status"] }) {
  const cls =
    status === "สำเร็จ"        ? "bg-emerald-500/15 text-emerald-600" :
    status === "รอดำเนินการ"  ? "bg-amber-400/15 text-amber-600"    :
                                  "bg-red-400/15 text-red-500";
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────
function Empty({ label }: { label: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-2 text-center">
      <span className="text-[40px]">📭</span>
      <p className="text-[14px] font-semibold text-ap-primary">ไม่มีรายการ{label}</p>
      <p className="text-[12px] text-ap-tertiary">รายการจะแสดงเมื่อมีการทำรายการ</p>
    </div>
  );
}

// ─── Transaction row ────────────────────────────────────────────────────────
function TxCard({ tx }: { tx: TxRow }) {
  const isPositive = tx.amountRaw >= 0;
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-ap-border last:border-0">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ap-primary truncate">{tx.label}</p>
        <p className="text-[11px] text-ap-tertiary mt-0.5">{tx.date}</p>
        <div className="mt-1">
          <StatusBadge status={tx.status} />
        </div>
      </div>
      <div className="text-right flex-shrink-0 pl-4">
        <p className={`text-[16px] font-bold tabular-nums ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
          {isPositive ? "+" : ""}{tx.amountRaw.toFixed(2)}
        </p>
        {tx.balanceAfter > 0 && (
          <p className="text-[11px] text-ap-tertiary tabular-nums">คงเหลือ {tx.balanceAfter.toFixed(2)}</p>
        )}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
interface Props {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function TransactionsPage({ searchParams }: Props) {
  const [user, params] = await Promise.all([requireAuth(), searchParams]);
  const phone  = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  const tabId  = TABS.find((t) => t.id === params?.tab) ? params!.tab! : "deposit";
  const tab    = TABS.find((t) => t.id === tabId)!;

  // fetch ตาม tab
  let rows: TxRow[] = [];
  if (tabId === "spin") {
    rows = await getSpinHistory(user.id);
  } else if (tabId === "bonus") {
    rows = await getBonusLog(user.id);
  } else {
    rows = await getCreditLog(user.id, TAB_KINDS[tabId] ?? []);
  }

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Navbar balance={user.balance} diamond={user.diamond} userName={user.displayName ?? undefined} userPhone={phone} />

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard"
            className="w-8 h-8 rounded-xl bg-white border border-ap-border flex items-center justify-center shadow-sm hover:bg-ap-bg transition-colors">
            <svg className="w-4 h-4 text-ap-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[18px] font-bold text-ap-primary leading-tight">ประวัติการเงิน</h1>
          </div>
        </div>

        {/* Tabs — scroll ได้ */}
        <div className="-mx-4 px-4 flex gap-2 overflow-x-scroll pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={`/transactions?tab=${t.id}`}
              className={[
                "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors border",
                t.id === tabId
                  ? "bg-ap-blue text-white border-ap-blue shadow-sm"
                  : "bg-white text-ap-secondary border-ap-border hover:bg-ap-bg",
              ].join(" ")}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </Link>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
          {/* header */}
          <div className="px-4 py-3 border-b border-ap-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[18px]">{tab.icon}</span>
              <span className="text-[14px] font-bold text-ap-primary">รายการ{tab.label}</span>
            </div>
            <span className="text-[12px] text-ap-tertiary">{rows.length} รายการ</span>
          </div>

          {rows.length === 0
            ? <Empty label={tab.label} />
            : rows.map((tx) => <TxCard key={tx.id} tx={tx} />)
          }
        </div>

      </div>
    </div>
  );
}
