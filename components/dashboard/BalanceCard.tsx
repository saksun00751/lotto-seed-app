"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LastUpdated from "@/components/ui/LastUpdated";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLang } from "@/lib/i18n/context";
import { useUser, useUserRealtime } from "@/components/providers/UserProvider";

interface BalanceData {
  balance:  number;
  diamond:  number;
  cashback: number;
  downline: number;
  winlost:  number;
}

interface Props {
  phone:       string;
  displayName: string;
  initialData?: Partial<BalanceData>;
}

function requestIdle(callback: () => void) {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 1500 });
    return;
  }
  globalThis.setTimeout(callback, 500);
}

export default function BalanceCard({ phone, displayName, initialData }: Props) {
  const t = useTranslation("dashboard");
  const { lang } = useLang();
  const user = useUser();
  const realtime = useUserRealtime();
  const [data, setData]       = useState<BalanceData | null>(
    initialData
      ? {
          balance: initialData.balance ?? 0,
          diamond: initialData.diamond ?? 0,
          cashback: initialData.cashback ?? 0,
          downline: initialData.downline ?? 0,
          winlost: initialData.winlost ?? 0,
        }
      : null,
  );
  const [loading, setLoading] = useState(!initialData);
  const [spinning, setSpinning] = useState(false);

  async function fetchBalance() {
    try {
      const res = await fetch("/api/balance", { cache: "no-store", credentials: "same-origin" });
      const json = await res.json();
      const p = json?.profile ?? json?.data ?? null;
      if (json?.success !== false && p) {
        setData({
          balance:  parseFloat(p.balance  ?? "0") || 0,
          diamond:  Number(p.diamond ?? 0),
          cashback: parseFloat(p.cashback ?? "0") || 0,
          downline: p.downline ?? 0,
          winlost:  p.winlost  ?? 0,
        });
      }
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!initialData) {
      void fetchBalance();
      return;
    }
    let cancelled = false;
    requestIdle(() => {
      if (!cancelled) void fetchBalance();
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!user) return;
    setData((prev) => ({
      balance: user.balance,
      diamond: user.diamond,
      cashback: prev?.cashback ?? 0,
      downline: prev?.downline ?? 0,
      winlost: prev?.winlost ?? 0,
    }));
  }, [user]);

  async function handleRefresh() {
    if (spinning) return;
    setSpinning(true);
    await realtime?.refreshBalance();
    await fetchBalance();
    setTimeout(() => setSpinning(false), 800);
  }

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtInt = (n: number) => Math.trunc(n).toLocaleString("en-US");
  const livePhone = user?.phone ?? phone;
  const liveDisplayName = user?.displayName ?? displayName;
  const statCards = [
    { key: "balance", value: loading ? "..." : fmt(data?.balance ?? 0), label: t.balance },
    { key: "diamond", value: loading ? "..." : fmtInt(data?.diamond ?? 0), label: t.diamond },
    { key: "cashback", value: loading ? "..." : fmt(data?.cashback ?? 0), label: t.cashback },
    {
      key: "referral",
      value: loading ? "..." : fmtInt(data?.downline ?? 0),
      label: t.referral,
      subLabel: `${t.thisMonth} ${loading ? "..." : fmt(data?.winlost ?? 0)}`,
    },
  ];

  return (
    <div className="bg-balance-card-bg rounded-3xl overflow-hidden relative border border-white/22 shadow-[0_18px_48px_rgba(0,47,106,0.35)]">
      <div className="absolute inset-0 bg-[radial-gradient(130%_110%_at_0%_0%,rgba(255,255,255,0.14),transparent_48%),radial-gradient(85%_65%_at_100%_0%,rgba(125,211,252,0.18),transparent_52%),linear-gradient(130deg,#084f9d_0%,#0a66c0_48%,#1b87d5_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_30%,rgba(0,28,66,0.20)_100%)]" />
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 blur-sm" />
      <div className="absolute -right-4 -bottom-10 w-32 h-32 rounded-full bg-cyan-200/10 blur-sm" />

      <div className="relative z-10">
        {/* Header */}
        <div className="relative flex items-center gap-2.5 px-4 pt-4 pb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border border-white/35 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="white">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2.5 flex-1 min-w-0">
            <div className="bg-white/18 border border-white/30 rounded-full px-3 py-1 self-start backdrop-blur-sm">
              <span className="text-[#e4efff] font-extrabold text-[18px] tracking-wider tabular-nums [text-shadow:0_1px_2px_rgba(0,0,0,0.26)]">{livePhone}</span>
            </div>
            {liveDisplayName && (
              <h3 className="sm:ml-auto text-[#e4efff] font-bold text-[18px] truncate [text-shadow:0_1px_2px_rgba(0,0,0,0.26)]">{liveDisplayName}</h3>
            )}
          </div>
        </div>

        <div className="relative px-4 pb-3">
          <LastUpdated />
        </div>

        {/* Grid */}
        <div className="mt-1 px-3 pb-3">
          <div className="relative grid grid-cols-2 gap-2.5">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
              <button
                onClick={handleRefresh}
                className="w-8 h-8 rounded-full bg-white border border-white ring-1 ring-[#0a5cae]/35 text-slate-700 flex items-center justify-center shadow-[0_4px_12px_rgba(0,34,80,0.22)] pointer-events-auto hover:bg-white active:scale-95 transition-all"
                title="รีเฟรช"
                aria-label="รีเฟรชยอดเงิน"
              >
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
                  style={{ transition: "transform 0.8s ease", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}
                >
                  <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                </svg>
              </button>
            </div>

            {statCards.map((stat) => (
              <div
                key={stat.key}
                className="px-4 py-4 rounded-2xl bg-black/14 border border-white/22 backdrop-blur-[2px] flex flex-col items-center justify-center gap-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              >
                <span className="text-[#dbe9ff] text-[20px] leading-tight font-extrabold tabular-nums tracking-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.30)]">
                  {stat.key === "referral" ? `${stat.label} ${stat.value}` : stat.value}
                </span>
                <span className="text-[#b8d2f3] text-[14px] leading-tight font-semibold">
                  {stat.key === "referral" ? stat.subLabel : stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ปุ่มเติมเงิน / ถอนเงิน */}
        <div className="relative grid grid-cols-2 gap-3 px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.14)" }}>
          <Link href={`/${lang}/deposit`}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#f5cf54] via-[#f2c449] to-[#ecb54a] text-[#1b2d4a] font-extrabold text-[13px] py-3 rounded-2xl border border-white/35 shadow-lg hover:brightness-105 active:scale-[0.98] transition-all"
            aria-label={t.deposit}
          >
            <span aria-hidden className="emoji-font text-[14px] leading-none">💰</span>
            {t.deposit}
          </Link>
          <Link href={`/${lang}/withdraw`}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#f06a8f] via-[#e35fa8] to-[#c85edd] text-[#fff2ff] font-extrabold text-[13px] py-3 rounded-2xl border border-white/24 shadow-lg hover:brightness-105 active:scale-[0.98] transition-all"
            aria-label={t.withdraw}
          >
            <span aria-hidden className="emoji-font text-[14px] leading-none">💸</span>
            {t.withdraw}
          </Link>
        </div>
      </div>
    </div>
  );
}
