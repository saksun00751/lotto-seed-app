"use client";
import { useState } from "react";
import { BetTypeId, BillRow, betTypeLabel } from "./types";
import Toast from "@/components/ui/Toast";
import { useLang } from "@/lib/i18n/context";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface Props {
  bills:       BillRow[];
  lotteryName: string;
  totalAmount: number;
  onConfirm:   () => Promise<{ ok: boolean; error?: string; message?: string; response?: unknown }>;
  onSuccess?:  () => void;
  onCancel:    () => void;
}

function getAmountLabel(betType: BetTypeId, side: "top" | "bot", t: Record<string, string>): string {
  if (side === "top") {
    if (betType === "3top" || betType === "2top" || betType === "6perm" || betType === "19door" || betType === "winnum") return t.top;
    if (betType === "3tod") return t.tod;
    if (betType === "2bot") return t.bottom;
    if (betType === "run") return t.betTypeRun;
    return t.betTypeWinlay;
  }
  if (betType === "3top" || betType === "3tod" || betType === "6perm") return t.tod;
  if (betType === "2top" || betType === "2bot" || betType === "19door" || betType === "winnum") return t.bottom;
  if (betType === "run") return t.betTypeRun;
  return t.betTypeWinlay;
}

export default function BetConfirmModal({
  bills,
  lotteryName,
  totalAmount,
  onConfirm,
  onSuccess,
  onCancel,
}: Props) {
  const { lang } = useLang();
  const t = useTranslation("bet");
  const localeByLang: Record<string, string> = { th: "th-TH", en: "en-US", kh: "km-KH", la: "lo-LA" };
  const numberLocale = localeByLang[lang] ?? "th-TH";
  const getBetTypeLabel = (id: BetTypeId) => {
    const key = `betType${id.charAt(0).toUpperCase()}${id.slice(1)}` as keyof typeof t;
    return (t[key] as string | undefined) ?? betTypeLabel(id);
  };
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [shaking, setShaking] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    const result = await onConfirm();
    if (result.ok) {
      setSuccessMsg(result.message ?? t.saveSuccessDefault);
      setTimeout(() => {
        onSuccess?.();
        onCancel();
      }, 5300);
    } else {
      setError(result.message ?? result.error ?? t.errorUnknown);
      setShaking(true);
      setTimeout(() => setShaking(false), 450);
      setLoading(false);
    }
  };
  const today = new Date().toLocaleDateString(numberLocale, {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  // group by slipNo for display
  const slipGroups = bills.reduce<Record<string, BillRow[]>>((acc, b) => {
    (acc[b.slipNo] ??= []).push(b);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className={`relative w-full max-w-md bg-white rounded-3xl shadow-card-xl overflow-hidden flex flex-col max-h-[90dvh] ${shaking ? "animate-shake" : ""}`}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-ap-border flex items-center justify-between shrink-0">
          <div>
            <p className="text-[16px] font-bold text-ap-primary">{t.confirmTitle}</p>
            <p className="text-[12px] text-ap-secondary mt-0.5">{lotteryName} • {today}</p>
          </div>
          <button onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-ap-bg hover:bg-ap-border text-ap-secondary transition-colors text-[18px]">
            ×
          </button>
        </div>

        {/* Bill list */}
        <div className="overflow-y-auto flex-1">
          {Object.entries(slipGroups).map(([slipNo, items]) => (
            <div key={slipNo} className="border-b border-ap-border last:border-0">
              <div className="px-5 py-2 bg-ap-bg/60">
                <span className="text-[10px] font-bold text-ap-tertiary uppercase tracking-wide">
                  {t.slipLabel} #{slipNo}
                </span>
              </div>
              {items.map((b) => {
                const amt    = b.top + b.bot;
                const amountRows = [
                  b.top > 0 ? { side: "top" as const, amount: b.top } : null,
                  b.bot > 0 ? { side: "bot" as const, amount: b.bot } : null,
                ].filter(Boolean) as { side: "top" | "bot"; amount: number }[];
                return (
                  <div key={b.id} className="px-5 py-2.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ap-primary flex items-center justify-center shrink-0">
                      <span className="text-white font-extrabold text-[13px] tabular-nums">{b.number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-full">
                        {getBetTypeLabel(b.betType)}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {amountRows.map((row, idx) => (
                          <p key={`${b.id}-${row.side}-${idx}`} className="text-[12px] font-bold tabular-nums">
                            <span className={row.side === "top" ? "text-ap-blue" : "text-ap-green"}>
                              <span className="font-semibold text-[10px]">{getAmountLabel(b.betType, row.side, t as Record<string, string>)} </span>
                              {row.amount}
                            </span>
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-bold text-ap-primary tabular-nums">฿{amt.toLocaleString(numberLocale)}</p>
                    </div>
                  </div>
                );
              })}
              {items[0]?.note && (
                <p className="px-5 pb-2 text-[11px] text-ap-secondary">
                  {t.note}: {items[0].note}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="shrink-0 border-t border-ap-border bg-ap-bg/50 px-5 py-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-ap-secondary">{t.totalItems}</span>
            <span className="text-[12px] font-semibold text-ap-primary">{bills.length} {t.items}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-ap-secondary">{t.totalBet}</span>
            <span className="text-[20px] font-bold text-ap-primary tabular-nums">
              ฿{totalAmount.toLocaleString(numberLocale)}
            </span>
          </div>
        </div>

        {/* Toast */}
        {successMsg && <Toast message={successMsg} type="success" durationMs={5000} onClose={() => setSuccessMsg("")} />}
        {error      && <Toast message={error}      type="error"   durationMs={5000} onClose={() => setError("")}      />}

        {/* Actions */}
        <div className="shrink-0 px-5 pb-5 pt-3 flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-3 rounded-2xl border-2 border-ap-border text-[14px] font-bold text-ap-secondary hover:bg-ap-bg active:scale-[0.98] transition-all disabled:opacity-50">
            {t.cancel}
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-[2] py-3 rounded-2xl bg-ap-blue hover:bg-ap-blue-h text-white text-[14px] font-bold active:scale-[0.98] transition-all shadow-md disabled:opacity-70">
            {loading ? t.saving : t.save}
          </button>
        </div>

      </div>
    </div>
  );
}
