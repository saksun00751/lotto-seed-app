"use client";
import { BetTypeId, BillRow, betTypeLabel } from "./types";
import { useLang } from "@/lib/i18n/context";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { BettingContext } from "@/lib/types/bet";

interface Props {
  bills:           BillRow[];
  lotteryName:     string;
  totalAmount:     number;
  bettingContext?: BettingContext;
  onConfirm:       () => void;
  onCancel:        () => void;
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

type SlipGroupKey = "top" | "bottom" | "tod";

function getSlipGroupKey(betType: BetTypeId): SlipGroupKey {
  if (betType === "3tod") return "tod";
  if (betType === "2bot" || betType === "winlay") return "bottom";
  return "top";
}

export default function BetConfirmModal({
  bills,
  lotteryName,
  totalAmount,
  bettingContext,
  onConfirm,
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
  const handleConfirm = () => {
    onConfirm();
    onCancel();
  };
  const today = new Date().toLocaleDateString(numberLocale, {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  const groupMeta: { key: SlipGroupKey; label: string }[] = [
    { key: "top", label: t.top },
    { key: "bottom", label: t.bottom },
    { key: "tod", label: t.tod },
  ];

  const groupedBills = (() => {
    const base: Record<SlipGroupKey, BillRow[]> = { top: [], bottom: [], tod: [] };
    for (const b of bills) base[getSlipGroupKey(b.betType)].push(b);
    return base;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className={"relative w-full max-w-md bg-white rounded-3xl shadow-card-xl overflow-hidden flex flex-col max-h-[90dvh]"}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-ap-border flex items-center justify-between shrink-0">
          <div>
            <p className="text-[16px] font-bold text-ap-primary">{t.confirmTitle}</p>
            <p className="text-[14px] text-ap-primary font-medium mt-0.5">{lotteryName} • {today}</p>
          </div>
          <button onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-ap-bg hover:bg-ap-border text-ap-secondary transition-colors text-[18px]">
            ×
          </button>
        </div>

        {/* Bill list */}
        <div className="overflow-y-auto flex-1">
          {groupMeta.map((group) => {
            const items = groupedBills[group.key];
            if (!items.length) return null;
            return (
              <div key={group.key} className="border-b border-ap-border last:border-0">
                <div className="px-5 py-2 bg-ap-bg/80 flex items-center justify-between">
                  <span className="text-[14px] font-bold text-ap-primary uppercase tracking-wide">{group.label}</span>
                  <span className="text-[14px] font-bold text-ap-secondary">{items.length} {t.items}</span>
                </div>
                {items.map((b) => {
                  const amt = b.top + b.bot;
                  return (
                    <div key={b.id} className="px-5 py-2.5 flex items-center gap-3 border-t border-ap-border first:border-t-0">
                      <div className="w-10 h-10 rounded-xl bg-ap-primary flex items-center justify-center shrink-0">
                        <span className="text-white font-extrabold text-[14px] tabular-nums">{b.number}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[14px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-full">
                          {getBetTypeLabel(b.betType)}
                        </span>
                        <p className="mt-0.5 text-[14px] font-bold tabular-nums text-ap-blue">
                          <span className="font-semibold text-[14px]">{getAmountLabel(b.betType, "top", t as Record<string, string>)} </span>
                          {amt}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[14px] font-bold text-ap-primary tabular-nums">฿{amt.toLocaleString(numberLocale)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {(() => {
          const subtotalAmount = totalAmount;
          const discountAmount = bills.reduce((sum, b) => {
            const ctxBetType = b.betType;
            const discountPercent = Number(bettingContext?.[ctxBetType]?.discountPercent ?? 0);
            const amt = b.top + b.bot;
            return sum + (amt * (discountPercent > 0 ? discountPercent : 0)) / 100;
          }, 0);
          const discountPct = subtotalAmount > 0 ? (discountAmount / subtotalAmount) * 100 : 0;
          const netAmount = Math.max(0, subtotalAmount - discountAmount);
          return (
            <div className="shrink-0 border-t border-ap-border bg-ap-bg/70 px-5 py-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-ap-primary">{t.totalItems}</span>
                <span className="text-[14px] font-bold text-ap-primary">{bills.length} {t.items}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-ap-primary">ยอดก่อนหักส่วนลด</span>
                <span className="text-[18px] font-bold text-ap-primary tabular-nums">
                  ฿{subtotalAmount.toLocaleString(numberLocale)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-ap-primary">
                  ส่วนลด ({discountPct.toLocaleString(numberLocale, { maximumFractionDigits: 2 })}%)
                </span>
                <span className="text-[14px] font-bold text-ap-green tabular-nums">
                  -฿{discountAmount.toLocaleString(numberLocale, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-ap-border">
                <span className="text-[15px] font-bold text-ap-primary">ยอดหลังหักส่วนลด</span>
                <span className="text-[20px] font-bold text-ap-primary tabular-nums">
                  ฿{netAmount.toLocaleString(numberLocale, { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Actions */}
        <div className="shrink-0 px-5 pb-5 pt-3 flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border-2 border-ap-border text-[14px] font-bold text-ap-secondary hover:bg-ap-bg active:scale-[0.98] transition-all">
            {t.cancel}
          </button>
          <button onClick={handleConfirm}
            className="flex-[2] py-3 rounded-2xl bg-ap-blue hover:bg-ap-blue-h text-white text-[14px] font-bold active:scale-[0.98] transition-all shadow-md">
            {t.save}
          </button>
        </div>

      </div>
    </div>
  );
}
