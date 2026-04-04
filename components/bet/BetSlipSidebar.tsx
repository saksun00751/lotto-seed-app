"use client";
import { useState } from "react";
import { BetTypeId, BillRow, betTypeLabel } from "./types";
import BetConfirmModal from "./BetConfirmModal";
import CountdownTimer from "@/components/ui/CountdownTimer";
import Toast from "@/components/ui/Toast";
import { useLang } from "@/lib/i18n/context";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { BettingContext } from "@/lib/types/bet";

interface Props {
  bills:         BillRow[];
  drawId?:       number | null;
  packageId?:    number;
  bettingContext?: BettingContext;
  lotteryName:   string;
  lotteryFlag?:  string;
  lotteryLogo?:  string;
  closeAt?:      string;
  totalAmount:   number;
  onDelete:      (id: string) => void;
  onClearAll:    () => void;
  onConfirm:     () => Promise<{ ok: boolean; error?: string; message?: string; response?: unknown }>;
  onConfirmSuccess?: () => void;
}

type PayloadBetType = "top_3" | "tod_3" | "top_2" | "bottom_2" | "run_top" | "run_bottom";

interface PayloadItem {
  bet_type: PayloadBetType;
  number: string;
  amount: number;
  note: string;
}

const TOP_SIDE_MAP: Partial<Record<BetTypeId, PayloadBetType>> = {
  "3top": "top_3",
  "3tod": "tod_3",
  "2top": "top_2",
  "2bot": "bottom_2",
  "run": "run_top",
  "winlay": "run_bottom",
  "6perm": "top_3",
  "19door": "top_2",
  "winnum": "top_2",
};

const BOT_SIDE_MAP: Partial<Record<BetTypeId, PayloadBetType>> = {
  "3top": "tod_3",
  "3tod": "tod_3",
  "2top": "bottom_2",
  "2bot": "bottom_2",
  "run": "run_top",
  "winlay": "run_bottom",
  "6perm": "tod_3",
  "19door": "bottom_2",
  "winnum": "bottom_2",
};

function mapBillsToItems(bills: BillRow[]): PayloadItem[] {
  return bills.flatMap((b) => {
    const rows: PayloadItem[] = [];
    const note = b.note?.trim() ?? "";

    const topType = TOP_SIDE_MAP[b.betType];
    if (topType && b.top > 0) {
      rows.push({
        bet_type: topType,
        number: b.number,
        amount: Number(b.top),
        note,
      });
    }

    const botType = BOT_SIDE_MAP[b.betType];
    if (botType && b.bot > 0) {
      rows.push({
        bet_type: botType,
        number: b.number,
        amount: Number(b.bot),
        note,
      });
    }

    return rows;
  });
}

const PAYLOAD_TO_CTX_BET_TYPE: Record<PayloadBetType, BetTypeId> = {
  top_3: "3top",
  tod_3: "3tod",
  top_2: "2top",
  bottom_2: "2bot",
  run_top: "run",
  run_bottom: "winlay",
};

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

export default function BetSlipSidebar({
  bills,
  drawId,
  packageId,
  bettingContext,
  lotteryName,
  lotteryFlag,
  lotteryLogo,
  closeAt,
  totalAmount,
  onDelete,
  onClearAll,
  onConfirm,
  onConfirmSuccess,
}: Props) {
  const { lang } = useLang();
  const t = useTranslation("bet");
  const localeByLang: Record<string, string> = { th: "th-TH", en: "en-US", kh: "km-KH", la: "lo-LA" };
  const numberLocale = localeByLang[lang] ?? "th-TH";
  const getBetTypeLabel = (id: BetTypeId) => {
    const key = `betType${id.charAt(0).toUpperCase()}${id.slice(1)}` as keyof typeof t;
    return (t[key] as string | undefined) ?? betTypeLabel(id);
  };
  const [showModal,  setShowModal]  = useState(false);
  const [closedToast, setClosedToast] = useState(false);
  const payloadItems = mapBillsToItems(bills);
  const subtotalAmount = payloadItems.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = payloadItems.reduce((sum, item) => {
    const ctxBetType = PAYLOAD_TO_CTX_BET_TYPE[item.bet_type];
    const discountPercent = Number(bettingContext?.[ctxBetType]?.discountPercent ?? 0);
    return sum + (item.amount * (discountPercent > 0 ? discountPercent : 0)) / 100;
  }, 0);
  const discountPct = subtotalAmount > 0 ? (discountAmount / subtotalAmount) * 100 : 0;
  const netAmount = Math.max(0, subtotalAmount - discountAmount);

  function handleOpenModal() {
    if (closeAt && new Date(closeAt).getTime() <= Date.now()) {
      setClosedToast(true);
      return;
    }
    setShowModal(true);
  }

  const handleConfirm = async () => {
    return onConfirm();
  };
  return (
    <>
    {showModal && (
      <BetConfirmModal
        bills={bills}
        lotteryName={lotteryName}
        totalAmount={totalAmount}
        onConfirm={handleConfirm}
        onSuccess={onConfirmSuccess}
        onCancel={() => setShowModal(false)}
      />
    )}
    <div className="space-y-3">
      <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-ap-border sticky top-4">

        {/* Header */}
        <div className="px-4 py-3 border-b border-ap-border bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[17px] leading-none">📋</span>
              <span className="text-[15px] leading-none font-bold text-ap-primary">{t.slipTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-white bg-ap-blue px-2.5 py-0.5 rounded-full leading-none">
                {bills.length} {t.items}
              </span>
              {bills.length > 0 && (
                <button onClick={onClearAll} className="text-[13px] font-semibold text-ap-red hover:underline">
                  {t.clearAll}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            {lotteryLogo
              ? <img src={lotteryLogo} alt={lotteryName} className="w-4 h-4 rounded-full object-cover shrink-0" />
              : lotteryFlag ? <span className="text-[13px] shrink-0">{lotteryFlag}</span> : null
            }
            <span className="text-[13px] text-ap-secondary font-medium">{lotteryName}</span>
          </div>
        </div>

        {/* Bill list */}
        {bills.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-2">
            <span className="text-[48px]">📋</span>
            <p className="text-[13px] font-semibold text-ap-primary">{t.noItems}</p>
            <p className="text-[12px] text-ap-secondary">{t.enterAndAdd}</p>
          </div>
        ) : (
          <div className="divide-y divide-ap-border max-h-[480px] overflow-y-auto">
            {[...bills].reverse().map((b) => {
              const amt    = b.top + b.bot;
              const amountRows = [
                b.top > 0 ? { side: "top" as const, amount: b.top } : null,
                b.bot > 0 ? { side: "bot" as const, amount: b.bot } : null,
              ].filter(Boolean) as { side: "top" | "bot"; amount: number }[];
              return (
                <div key={b.id} className="px-4 py-3 flex items-center gap-3 hover:bg-ap-bg/40 transition-colors">
                  {/* Number box */}
                  <div className="w-12 h-12 rounded-2xl bg-ap-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-extrabold text-[15px] tabular-nums tracking-wider">{b.number}</span>
                  </div>

                  {/* Middle */}
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-[11px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full mb-1.5">
                      {getBetTypeLabel(b.betType)}
                    </span>
                    <div className="space-y-0.5">
                      {amountRows.map((row, idx) => (
                        <p key={`${b.id}-${row.side}-${idx}`} className="text-[13px] font-bold tabular-nums">
                          <span className={row.side === "top" ? "text-ap-blue" : "text-ap-green"}>
                            <span className="text-[11px] font-semibold">{getAmountLabel(b.betType, row.side, t as Record<string, string>)} </span>
                            {row.amount}
                          </span>
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Right: ลบ + ยอดแทง */}
                  <div className="text-right flex-shrink-0 flex flex-col items-end">
                    <button onClick={() => onDelete(b.id)}
                      className="text-[10px] text-ap-red hover:underline mb-1.5">
                      {t.delete}
                    </button>
                    <p className="text-[10px] text-ap-tertiary">{t.totalBet}</p>
                    <p className="text-[13px] font-bold text-ap-primary tabular-nums">
                      ฿{amt.toLocaleString(numberLocale)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {bills.length > 0 && (
          <div className="border-t border-ap-border">
            <div className="px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-ap-secondary">{t.totalItems}</span>
                <span className="text-[12px] font-semibold text-ap-primary">{bills.length} {t.items}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[16px] text-ap-secondary">ยอดก่อนหักส่วนลด</span>
                <span className="text-[22px] font-bold text-ap-primary tabular-nums">
                  ฿{subtotalAmount.toLocaleString(numberLocale)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-ap-secondary">
                  ส่วนลด ({discountPct.toLocaleString(numberLocale, { maximumFractionDigits: 2 })}%)
                </span>
                <span className="text-[14px] font-bold text-ap-green tabular-nums">
                  -฿{discountAmount.toLocaleString(numberLocale, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-ap-border">
                <span className="text-[16px] text-ap-secondary">ยอดหลังหักส่วนลด</span>
                <span className="text-[22px] font-bold text-ap-primary tabular-nums">
                  ฿{netAmount.toLocaleString(numberLocale, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-ap-border">
                <span className="text-[16px] text-ap-red font-semibold">⏱ {t.closeIn}</span>
                {closeAt
                  ? <CountdownTimer closeAt={closeAt} className="text-[16px] font-bold text-ap-red tabular-nums" />
                  : <span className="text-[16px] font-bold text-ap-red tabular-nums">—</span>
                }
              </div>
            </div>
            <div className="px-4 pb-4">
              <button onClick={handleOpenModal}
                className="w-full bg-ap-blue hover:bg-ap-blue-h text-white font-bold text-[14px] py-3 rounded-2xl transition-colors active:scale-[0.98]">
                {t.confirmBet}
              </button>
            </div>
          </div>
        )}

      </div>

    </div>

    {closedToast && (
      <Toast
        message={t.closedBetToast}
        type="warning"
        onClose={() => setClosedToast(false)}
      />
    )}
    </>
  );
}
