"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLang } from "@/lib/i18n/context";

export interface CouponItem {
  code:         string;
  name:         string;
  status:       string;
  status_label: string;
  type:         string;
  type_label:   string;
  value:        number;
  turnpro:      number;
  amount_limit: number;
  rate:         string;
  date_expire:  string | null;
  can_claim:    boolean;
}

interface Props {
  items:  CouponItem[];
  count:  number;
  locale: string;
  onClaim:  (code: string) => Promise<{ success: boolean; message?: string }>;
  onRedeem: (code: string) => Promise<{ success: boolean; message?: string }>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    pending_claim: { cls: "bg-amber-100 text-amber-700 border-amber-300",   label: "รอรับโบนัส" },
    claimed:       { cls: "bg-emerald-100 text-emerald-700 border-emerald-300", label: "รับแล้ว" },
    expired:       { cls: "bg-gray-100 text-gray-500 border-gray-300",      label: "หมดอายุ"  },
    used:          { cls: "bg-red-100 text-red-500 border-red-300",         label: "ใช้แล้ว"  },
  };
  const s = map[status] ?? { cls: "bg-gray-100 text-gray-500 border-gray-300", label: status };
  return (
    <span className={`text-[13px] font-bold px-2.5 py-0.5 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function TypeBadge({ type, label }: { type: string; label: string }) {
  const colors: Record<string, string> = {
    credit:  "bg-blue-100 text-blue-700",
    bonus:   "bg-violet-100 text-violet-700",
    cashback: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-[12px] font-bold px-2 py-0.5 rounded ${colors[type] ?? "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  );
}

function CouponCard({
  item,
  onClaim,
}: {
  item: CouponItem;
  onClaim: (code: string) => Promise<{ success: boolean; message?: string }>;
}) {
  const t = useTranslation("coupon");
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const isActive  = item.status === "pending_claim";
  const isClaimed = item.status === "claimed" || item.status === "used";

  function handleClaim() {
    startTransition(async () => {
      const res = await onClaim(item.code);
      setToast({ msg: res.message ?? (res.success ? t.claimSuccess : t.claimFail), ok: res.success });
      setTimeout(() => setToast(null), 3000);
    });
  }

  return (
    <div className={`relative bg-white rounded-2xl border overflow-hidden shadow-card transition-all ${isActive ? "border-amber-300" : "border-ap-border opacity-80"}`}>

      {/* Ticket top strip */}
      <div className={`h-2 w-full ${isActive ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-ap-bg"}`} />

      {/* Notch cutout effect */}
      <div className="px-4 pt-3 pb-4">

        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-extrabold text-ap-primary leading-tight">{item.name}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <TypeBadge type={item.type} label={item.type_label} />
              <StatusBadge status={item.status} />
            </div>
          </div>
          {/* Value */}
          <div className="text-right flex-shrink-0">
            <p className="text-[26px] font-extrabold text-amber-500 tabular-nums leading-tight">
              ฿{item.value.toLocaleString("en-US", { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Dashed divider */}
        <div className="border-t border-dashed border-ap-border my-3 relative">
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-ap-bg border border-ap-border" />
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-ap-bg border border-ap-border" />
        </div>

        {/* Code */}
        <div className="bg-ap-bg rounded-xl px-3 py-2 mb-3 flex items-center justify-between">
          <span className="text-[13px] text-ap-tertiary font-bold">CODE</span>
          <span className="text-[17px] font-extrabold font-mono tracking-widest text-ap-primary">{item.code}</span>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="bg-ap-bg/60 rounded-xl py-2">
            <p className="text-[12px] font-semibold text-ap-tertiary">{t.labelTurnover}</p>
            <p className="text-[15px] font-extrabold text-ap-primary tabular-nums">×{item.turnpro}</p>
          </div>
          <div className="bg-ap-bg/60 rounded-xl py-2">
            <p className="text-[12px] font-semibold text-ap-tertiary">{t.labelLimit}</p>
            <p className="text-[15px] font-extrabold text-ap-primary tabular-nums">{item.amount_limit}</p>
          </div>
          <div className="bg-ap-bg/60 rounded-xl py-2">
            <p className="text-[12px] font-semibold text-ap-tertiary">{t.labelExpire}</p>
            <p className="text-[13px] font-extrabold text-ap-primary">
              {item.date_expire
                ? new Date(item.date_expire).toLocaleDateString("th-TH", { day: "numeric", month: "short" })
                : t.noExpire}
            </p>
          </div>
        </div>

        {/* Claim button */}
        {item.can_claim && !isClaimed ? (
          <button
            type="button"
            onClick={handleClaim}
            disabled={pending}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[15px] font-extrabold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {pending ? t.claiming : t.claimBtn}
          </button>
        ) : isClaimed ? (
          <div className="w-full py-2.5 rounded-xl bg-ap-bg border border-ap-border text-center text-[15px] font-bold text-ap-tertiary">
            ✓ {item.status_label}
          </div>
        ) : null}

        {/* Toast */}
        {toast && (
          <div className={`mt-2 px-3 py-2 rounded-xl text-[14px] font-bold text-center ${toast.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}

function RedeemBox({ onRedeem }: { onRedeem: (code: string) => Promise<{ success: boolean; message?: string }> }) {
  const t = useTranslation("coupon");
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    startTransition(async () => {
      const res = await onRedeem(code.trim().toUpperCase());
      setToast({ msg: res.message ?? (res.success ? t.claimSuccess : t.claimFail), ok: res.success });
      if (res.success) setCode("");
      setTimeout(() => setToast(null), 3500);
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-ap-border shadow-card p-4">
      <p className="text-[14px] font-extrabold text-ap-tertiary uppercase tracking-wide mb-3">🎟 {t.redeemLabel}</p>
      <form onSubmit={handleRedeem} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t.redeemPlaceholder}
          maxLength={30}
          className="flex-1 border border-ap-border rounded-xl px-3 py-2.5 text-[15px] font-mono font-bold uppercase tracking-wider outline-none focus:border-ap-blue bg-white transition-all"
        />
        <button
          type="submit"
          disabled={!code.trim() || pending}
          className="px-4 py-2.5 rounded-xl bg-ap-blue text-white text-[15px] font-extrabold hover:bg-ap-blue-h active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "..." : t.redeemBtn}
        </button>
      </form>
      {toast && (
        <div className={`mt-2 px-3 py-2 rounded-xl text-[14px] font-bold ${toast.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default function CouponPage({ items, count, locale, onClaim, onRedeem }: Props) {
  const t = useTranslation("coupon");
  const { lang } = useLang();

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard`}
            className="w-8 h-8 rounded-xl bg-white border border-ap-border flex items-center justify-center shadow-sm hover:bg-ap-bg transition-colors">
            <svg className="w-4 h-4 text-ap-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[20px] font-extrabold text-ap-primary leading-tight">🎟 {t.title}</h1>
            <p className="text-[14px] font-medium text-ap-tertiary">{t.count.replace("{n}", String(count))}</p>
          </div>
        </div>

        {/* Redeem input */}
        <RedeemBox onRedeem={onRedeem} />

        {/* List */}
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-ap-border shadow-card py-16 text-center">
            <div className="text-[48px] mb-3">🎟</div>
            <p className="text-[17px] font-extrabold text-ap-primary">{t.empty}</p>
            <p className="text-[14px] font-medium text-ap-tertiary mt-1">{t.emptyDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <CouponCard key={item.code} item={item} onClaim={onClaim} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
