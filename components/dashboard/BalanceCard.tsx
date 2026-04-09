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
}

export default function BalanceCard({ phone, displayName }: Props) {
  const t = useTranslation("dashboard");
  const { lang } = useLang();
  const user = useUser();
  const realtime = useUserRealtime();
  const [data, setData]       = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => { void fetchBalance(); }, []);
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
  const livePhone = user?.phone ?? phone;
  const liveDisplayName = user?.displayName ?? displayName;

  return (
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
            <span className="text-white font-bold text-[18px] tracking-wider tabular-nums">{livePhone}</span>
          </div>
          {liveDisplayName && (
            <h3 className="sm:ml-auto text-white font-bold text-[18px] truncate">{liveDisplayName}</h3>
          )}
        </div>
      </div>

      <div className="relative px-4 pb-3">
        <LastUpdated />
      </div>

      {/* Grid */}
      <div className="relative grid grid-cols-2" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
        {/* Refresh */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <button
            onClick={handleRefresh}
            className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow pointer-events-auto hover:bg-white transition-colors"
            title="รีเฟรช"
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="#555"
              style={{ transition: "transform 0.8s ease", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}
            >
              <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex flex-col items-center justify-center gap-0.5" style={{ borderRight: "1px solid rgba(255,255,255,0.15)", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
          <span className="text-white text-[20px] font-bold tabular-nums">{loading ? "..." : fmt(data?.balance ?? 0)}</span>
          <span className="text-white/70 text-[11px]">{t.balance}</span>
        </div>
        <div className="p-4 flex flex-col items-center justify-center gap-0.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
          <span className="text-white text-[20px] font-bold tabular-nums">{loading ? "..." : fmt(data?.diamond ?? 0)}</span>
          <span className="text-white/70 text-[11px]">{t.diamond}</span>
        </div>
        <div className="p-4 flex flex-col items-center justify-center gap-0.5" style={{ borderRight: "1px solid rgba(255,255,255,0.15)" }}>
          <span className="text-white text-[20px] font-bold tabular-nums">{loading ? "..." : fmt(data?.cashback ?? 0)}</span>
          <span className="text-white/70 text-[11px]">{t.cashback}</span>
        </div>
        <div className="p-4 flex flex-col items-center justify-center gap-0.5">
          <span className="text-white/70 text-[14px]">{t.referral} <span className="text-white font-bold">{loading ? "..." : fmt(data?.downline ?? 0)}</span></span>
          <span className="text-white/70 text-[14px]">{t.thisMonth} <span className="text-white font-bold">{loading ? "..." : fmt(data?.winlost ?? 0)}</span></span>
        </div>
      </div>

      {/* ปุ่มเติมเงิน / ถอนเงิน */}
      <div className="grid grid-cols-2 gap-3 px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
        <Link href={`/${lang}/deposit`}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold text-[13px] py-2.5 rounded-2xl shadow-md hover:brightness-105 active:scale-[0.98] transition-all">
          💰 {t.deposit}
        </Link>
        <Link href={`/${lang}/withdraw`}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold text-[13px] py-2.5 rounded-2xl shadow-md hover:brightness-105 active:scale-[0.98] transition-all">
          💸 {t.withdraw}
        </Link>
      </div>
    </div>
  );
}
