"use client";
import { useState } from "react";
import { BetTypeId, BillRow, BET_RATE, betTypeLabel } from "./types";
import type { BetRateRow } from "@/lib/db/lottery";
import Toast from "@/components/ui/Toast";

interface Props {
  bills:       BillRow[];
  lotteryName: string;
  totalAmount: number;
  totalMaxWin: number;
  betRates?:   BetRateRow[];
  onConfirm:   () => Promise<{ ok: boolean; error?: string }>;
  onCancel:    () => void;
}

export default function BetConfirmModal({
  bills,
  lotteryName,
  totalAmount,
  totalMaxWin,
  betRates = [],
  onConfirm,
  onCancel,
}: Props) {
  const rateMap = betRates.length
    ? Object.fromEntries(betRates.map((r) => [r.id, parseFloat(r.rate)])) as Partial<Record<BetTypeId, number>>
    : {} as Partial<Record<BetTypeId, number>>;
  const getRate = (id: BetTypeId) => rateMap[id] ?? BET_RATE[id];
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    const result = await onConfirm();
    if (result.ok) {
      setSuccess(true);
      setTimeout(onCancel, 2000);
    } else {
      setError(result.error ?? "เกิดข้อผิดพลาด");
      setShaking(true);
      setTimeout(() => setShaking(false), 450);
      setLoading(false);
    }
  };
  const today = new Date().toLocaleDateString("th-TH", {
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
            <p className="text-[16px] font-bold text-ap-primary">ยืนยันการแทงหวย</p>
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
                  โพย #{slipNo}
                </span>
              </div>
              {items.map((b) => {
                const amt    = b.top + b.bot;
                const maxWin = amt * getRate(b.betType);
                return (
                  <div key={b.id} className="px-5 py-2.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ap-primary flex items-center justify-center shrink-0">
                      <span className="text-white font-extrabold text-[13px] tabular-nums">{b.number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-full">
                        {betTypeLabel(b.betType)}
                      </span>
                      <p className="text-[12px] font-bold mt-0.5 tabular-nums">
                        {b.top > 0 && <span className="text-ap-blue"><span className="font-semibold text-[10px]">บน </span>{b.top}</span>}
                        {b.top > 0 && b.bot > 0 && <span className="text-ap-tertiary mx-1">×</span>}
                        {b.bot > 0 && <span className="text-ap-green"><span className="font-semibold text-[10px]">ล่าง </span>{b.bot}</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-bold text-ap-primary tabular-nums">฿{amt.toLocaleString("th-TH")}</p>
                      <p className="text-[10px] text-ap-green font-semibold tabular-nums">ชนะ ฿{maxWin.toLocaleString("th-TH")}</p>
                    </div>
                  </div>
                );
              })}
              {items[0]?.note && (
                <p className="px-5 pb-2 text-[11px] text-ap-secondary">
                  หมายเหตุ: {items[0].note}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="shrink-0 border-t border-ap-border bg-ap-bg/50 px-5 py-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-ap-secondary">จำนวนรายการ</span>
            <span className="text-[12px] font-semibold text-ap-primary">{bills.length} รายการ</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-ap-secondary">ยอดรวมแทง</span>
            <span className="text-[20px] font-bold text-ap-primary tabular-nums">
              ฿{totalAmount.toLocaleString("th-TH")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-ap-secondary">ชนะสูงสุด</span>
            <span className="text-[14px] font-bold text-ap-green tabular-nums">
              ฿{totalMaxWin.toLocaleString("th-TH")}
            </span>
          </div>
        </div>

        {/* Toast */}
        {success && <Toast message="ซื้อหวยสำเร็จ! 🎉" type="success" onClose={() => setSuccess(false)} />}
        {error   && <Toast message={error}              type="error"   onClose={() => setError("")}    />}

        {/* Actions */}
        <div className="shrink-0 px-5 pb-5 pt-3 flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-3 rounded-2xl border-2 border-ap-border text-[14px] font-bold text-ap-secondary hover:bg-ap-bg active:scale-[0.98] transition-all disabled:opacity-50">
            ยกเลิก
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-[2] py-3 rounded-2xl bg-ap-blue hover:bg-ap-blue-h text-white text-[14px] font-bold active:scale-[0.98] transition-all shadow-md disabled:opacity-70">
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>

      </div>
    </div>
  );
}
