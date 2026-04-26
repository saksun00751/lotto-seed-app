"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface Props {
  locale: string;
  bonus: number;
  cashback: number;
  faststart: number;
  ic: number;
}

interface LiveData {
  bonus: number;
  cashback: number;
  faststart: number;
  ic: number;
}
type ClaimSource = keyof LiveData;

interface ClaimTarget {
  source: ClaimSource;
  label: string;
  amount: number;
}

interface BalanceApiPayload {
  balance?: string | number;
  diamond?: string | number;
  bonus?: string | number;
  cashback?: string | number;
  faststart?: string | number;
  downline?: string | number;
  winlost?: string | number;
  ic?: string | number;
  referral_income?: string | number;
  referralIncome?: string | number;
  referral_balance?: string | number;
}
interface BalanceApiResponse {
  success?: boolean;
  profile?: BalanceApiPayload;
  data?: BalanceApiPayload;
  message?: string;
}

interface WalletClaimResponse {
  success?: boolean;
  message?: string;
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface BonusItem {
  key: ClaimSource;
  source: ClaimSource;
  label: string;
  desc: string;
  value: string;
  unit: string;
  cardCls: string;
  iconBg: string;
  icon: React.ReactNode;
}

function WheelIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
      <path d="M12 3v9" /><path d="M12 21v-9" />
      <path d="M3 12h9" /><path d="M21 12h-9" />
      <path d="M5.6 5.6l6.4 6.4" /><path d="M18.4 18.4L12 12" />
      <path d="M18.4 5.6L12 12" /><path d="M5.6 18.4L12 12" />
    </svg>
  );
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  );
}

function FriendsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3.2" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M2.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M14.5 18.5c.3-2.3 2.2-4 4.5-4 1.4 0 2.6.5 3.5 1.3" />
    </svg>
  );
}

function HandshakeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10l3-3h5l2 2" />
      <path d="M21 10l-3-3h-4l-2 2" />
      <path d="M3 10v4l5 4 2-1 2 1 3-2 2 1 4-3v-4" />
      <path d="M9 13l2 2" /><path d="M13 13l2 2" />
    </svg>
  );
}

function ClaimConfirmModal({
  t,
  target,
  pending,
  onCancel,
  onConfirm,
}: {
  t: Record<string, string>;
  target: ClaimTarget | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onCancel}
        aria-label={t.claimModalCancel ?? "ยกเลิก"}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />

      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden border border-amber-300/80 shadow-[0_26px_65px_rgba(75,49,6,0.45)] bg-white animate-pop-in">
        <div className="bg-[linear-gradient(180deg,#f5c24a_0%,#d29a2a_100%)] px-4 py-3 border-b border-amber-700/20">
          <p className="text-[18px] font-extrabold text-[#2e2003]">{t.claimModalTitle ?? "ยืนยันการรับโบนัส"}</p>
          <p className="text-[12px] text-[#4a3408]/85 mt-0.5">{t.claimModalSubtitle ?? "กรุณาตรวจสอบรายการก่อนทำรายการ"}</p>
        </div>

        <div className="p-4 space-y-3">
          <div className="rounded-2xl border border-ap-border bg-ap-bg px-3 py-3">
            <p className="text-[12px] text-ap-tertiary">{t.claimModalSourceLabel ?? "ประเภทโบนัส"}</p>
            <p className="text-[20px] font-extrabold text-ap-primary mt-1">{target.label}</p>
            <p className="text-[11px] text-ap-tertiary mt-2">{t.claimModalAmountLabel ?? "จำนวนที่รับ"}</p>
            <p className="text-[20px] font-extrabold text-emerald-600 tabular-nums mt-1">฿{fmtMoney(target.amount)}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="h-10 rounded-xl border border-ap-border bg-white text-ap-secondary text-[13px] font-semibold hover:bg-ap-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.claimModalCancel ?? "ยกเลิก"}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className="h-10 rounded-xl bg-ap-blue text-white text-[13px] font-bold hover:bg-ap-blue-h transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pending ? (t.claiming ?? "กำลังรับ...") : (t.claimModalConfirm ?? "ยืนยันรับโบนัส")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BonusPage({
  locale,
  bonus,
  cashback,
  faststart,
  ic,
}: Props) {
  const t = useTranslation("bonus") as Record<string, string>;
  const [data, setData] = useState<LiveData>({ bonus, cashback, faststart, ic });
  const [claimTarget, setClaimTarget] = useState<ClaimTarget | null>(null);
  const [claimingSource, setClaimingSource] = useState<ClaimSource | null>(null);

  const fetchBonus = async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/member/loadbalance", { cache: "no-store", credentials: "same-origin", signal });
      const json = (await res.json()) as BalanceApiResponse;
      const p = (json?.profile ?? json?.data ?? json) as BalanceApiPayload | undefined;
      if (!p) return;
      setData({
        bonus: toNumber(p.bonus),
        cashback: toNumber(p.cashback),
        faststart: toNumber(p.faststart),
        ic: toNumber(p.ic ?? p.winlost),
      });
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      await fetchBonus(controller.signal);
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!claimTarget) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && claimingSource === null) {
        setClaimTarget(null);
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [claimTarget, claimingSource]);

  async function confirmClaim() {
    if (!claimTarget || claimingSource) return;

    setClaimingSource(claimTarget.source);
    try {
      const res = await fetch("/api/wallet/claim", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: claimTarget.source }),
      });
      const payload = (await res.json()) as WalletClaimResponse;
      const ok = Boolean(res.ok && payload.success);

      if (!ok) {
        toast.error(payload.message?.trim() || t.claimFailed || "ไม่สามารถรับโบนัสได้");
        return;
      }

      toast.success(payload.message?.trim() || t.claimSuccess || "รับโบนัสสำเร็จ");
      setClaimTarget(null);
      await fetchBonus();
    } catch {
      toast.error(t.networkError || "ไม่สามารถเชื่อมต่อระบบได้");
    } finally {
      setClaimingSource(null);
    }
  }

  const items: BonusItem[] = [
    {
      key: "bonus",
      source: "bonus",
      label: t.bonusField ?? t.totalBonus ?? "โบนัส",
      desc: t.bonusFieldDesc ?? "ยอดโบนัสสะสม",
      value: fmtMoney(data.bonus),
      unit: t.unitBaht,
      cardCls: "bg-gradient-to-br from-amber-100 to-orange-200/85 hover:ring-amber-300",
      iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
      icon: <WheelIcon className="w-7 h-7 text-white" />,
    },
    {
      key: "cashback",
      source: "cashback",
      label: t.cashback,
      desc: t.cashbackDesc,
      value: fmtMoney(data.cashback),
      unit: t.unitBaht,
      cardCls: "bg-gradient-to-br from-emerald-100 to-teal-200/85 hover:ring-emerald-300",
      iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
      icon: <CoinIcon className="w-7 h-7 text-white" />,
    },
    {
      key: "faststart",
      source: "faststart",
      label: t.faststart ?? "Fast Start",
      desc: t.faststartDesc ?? "โบนัส Fast Start",
      value: fmtMoney(data.faststart),
      unit: t.unitBaht,
      cardCls: "bg-gradient-to-br from-violet-100 to-fuchsia-200/85 hover:ring-violet-300",
      iconBg: "bg-gradient-to-br from-violet-400 to-fuchsia-500",
      icon: <FriendsIcon className="w-7 h-7 text-white" />,
    },
    {
      key: "ic",
      source: "ic",
      label: t.icField ?? "IC",
      desc: t.icFieldDesc ?? "ส่วนแบ่ง IC",
      value: fmtMoney(data.ic),
      unit: t.unitBaht,
      cardCls: "bg-gradient-to-br from-sky-100 to-blue-200/85 hover:ring-sky-300",
      iconBg: "bg-gradient-to-br from-sky-400 to-blue-500",
      icon: <HandshakeIcon className="w-7 h-7 text-white" />,
    },
  ];

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-4">

        {/* Top bar */}
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard`}
            className="w-8 h-8 rounded-xl bg-white border border-ap-border flex items-center justify-center shadow-sm hover:bg-ap-bg transition-colors">
            <svg className="w-4 h-4 text-ap-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[20px] font-extrabold text-ap-primary leading-tight">🎁 {t.title}</h1>
            <p className="text-[14px] font-medium text-ap-tertiary">{t.subtitle}</p>
          </div>
        </div>

        {/* Bonus grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                if (claimingSource !== null) return;
                setClaimTarget({
                  source: item.source,
                  label: item.label,
                  amount: data[item.source],
                });
              }}
              className={[
                "group relative overflow-hidden rounded-2xl border border-ap-border shadow-card p-4 sm:p-5",
                "hover:shadow-card-hover hover:-translate-y-[2px] transition-all duration-200",
                "ring-1 ring-transparent",
                "text-left",
                item.cardCls,
              ].join(" ")}
            >
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 rounded-2xl ${item.iconBg} flex items-center justify-center shadow-sm`}>
                    {item.icon}
                  </div>
                  <svg className="w-4 h-4 text-ap-tertiary group-hover:text-ap-primary transition-all"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div>
                  <p className="text-[15px] font-bold text-ap-secondary leading-tight">{item.label}</p>
                  <p className="text-[13px] font-medium text-ap-tertiary mt-0.5 leading-snug line-clamp-1">{item.desc}</p>
                </div>

                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-[26px] sm:text-[28px] font-extrabold text-ap-primary tabular-nums leading-none tracking-tight">
                    {item.value}
                  </span>
                  <span className="text-[13px] font-bold text-ap-tertiary">{item.unit}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-ap-border">
            <p className="text-[14px] font-bold text-ap-tertiary uppercase tracking-wide">{t.howTitle}</p>
          </div>
          <ul className="divide-y divide-ap-border">
            {[
              { icon: "🎡", label: t.stepSpinTitle,     desc: t.stepSpinDesc },
              { icon: "💸", label: t.stepCashbackTitle, desc: t.stepCashbackDesc },
              { icon: "👥", label: t.stepFriendTitle,   desc: t.stepFriendDesc },
              { icon: "🤝", label: t.stepReferTitle,    desc: t.stepReferDesc },
            ].map((step, idx) => (
              <li key={idx} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-10 h-10 rounded-xl bg-ap-bg flex items-center justify-center text-[20px] flex-shrink-0">
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-ap-primary leading-tight">{step.label}</p>
                  <p className="text-[13px] font-medium text-ap-secondary mt-0.5 leading-snug">{step.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>

      <ClaimConfirmModal
        t={t}
        target={claimTarget}
        pending={claimingSource !== null}
        onCancel={() => {
          if (claimingSource !== null) return;
          setClaimTarget(null);
        }}
        onConfirm={() => { void confirmClaim(); }}
      />
    </div>
  );
}
