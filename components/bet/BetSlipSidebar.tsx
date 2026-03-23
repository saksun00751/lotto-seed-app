"use client";
import { useState } from "react";
import { BetTypeId, BillRow, BET_RATE, betTypeLabel } from "./types";
import type { BetRateRow } from "@/lib/db/lottery";
import BetConfirmModal from "./BetConfirmModal";
import CountdownTimer from "@/components/ui/CountdownTimer";
import Toast from "@/components/ui/Toast";

interface Props {
  bills:        BillRow[];
  lotteryName:  string;
  closeAt?:     string;
  totalAmount:  number;
  totalMaxWin:  number;
  betRates?:    BetRateRow[];
  onDelete:     (id: string) => void;
  onClearAll:   () => void;
  onConfirm:    () => Promise<{ ok: boolean; error?: string }>;
}

export default function BetSlipSidebar({
  bills,
  lotteryName,
  closeAt,
  totalAmount,
  totalMaxWin,
  betRates = [],
  onDelete,
  onClearAll,
  onConfirm,
}: Props) {
  const rateMap = betRates.length
    ? Object.fromEntries(betRates.map((r) => [r.id, parseFloat(r.rate)])) as Partial<Record<BetTypeId, number>>
    : {} as Partial<Record<BetTypeId, number>>;
  const getRate = (id: BetTypeId) => rateMap[id] ?? BET_RATE[id];
  const [showModal,  setShowModal]  = useState(false);
  const [closedToast, setClosedToast] = useState(false);

  function handleOpenModal() {
    if (closeAt && new Date(closeAt).getTime() <= Date.now()) {
      setClosedToast(true);
      return;
    }
    setShowModal(true);
  }

  const handleConfirm = async () => {
    const result = await onConfirm();
    if (result.ok) setShowModal(false);
    return result;
  };

  return (
    <>
    {showModal && (
      <BetConfirmModal
        bills={bills}
        lotteryName={lotteryName}
        totalAmount={totalAmount}
        totalMaxWin={totalMaxWin}
        betRates={betRates}
        onConfirm={handleConfirm}
        onCancel={() => setShowModal(false)}
      />
    )}
    <div className="space-y-3">
      <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-ap-border sticky top-4">

        {/* Header */}
        <div className="px-4 py-3 border-b border-ap-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[18px]">📋</span>
              <span className="text-[15px] font-bold text-ap-primary">โพยหวย</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-white bg-ap-blue px-2.5 py-0.5 rounded-full">
                {bills.length} รายการ
              </span>
              {bills.length > 0 && (
                <button onClick={onClearAll} className="text-[12px] font-semibold text-ap-red hover:underline">
                  ล้างทั้งหมด
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[13px]">🇹🇭</span>
            <span className="text-[12px] text-ap-secondary font-medium">{lotteryName}</span>
          </div>
        </div>

        {/* Bill list */}
        {bills.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-2">
            <span className="text-[48px]">📋</span>
            <p className="text-[13px] font-semibold text-ap-primary">ยังไม่มีรายการ</p>
            <p className="text-[12px] text-ap-secondary">กรอกตัวเลขแล้วกดเพิ่ม</p>
          </div>
        ) : (
          <div className="divide-y divide-ap-border max-h-[480px] overflow-y-auto">
            {[...bills].reverse().map((b) => {
              const amt    = b.top + b.bot;
              const maxWin = amt * getRate(b.betType);
              return (
                <div key={b.id} className="px-4 py-3 flex items-center gap-3 hover:bg-ap-bg/40 transition-colors">
                  {/* Number box */}
                  <div className="w-12 h-12 rounded-2xl bg-ap-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-extrabold text-[15px] tabular-nums tracking-wider">{b.number}</span>
                  </div>

                  {/* Middle */}
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-[11px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full mb-1.5">
                      {betTypeLabel(b.betType)}
                    </span>
                    <p className="text-[13px] font-bold tabular-nums">
                      {b.top > 0 && <span className="text-ap-blue"><span className="text-[11px] font-semibold">บน </span>{b.top}</span>}
                      {b.top > 0 && b.bot > 0 && <span className="text-ap-tertiary mx-1">×</span>}
                      {b.bot > 0 && <span className="text-ap-green"><span className="text-[11px] font-semibold">ล่าง </span>{b.bot}</span>}
                    </p>
                  </div>

                  {/* Right: ลบ (top) + ยอดแทง + ชนะสูงสุด */}
                  <div className="text-right flex-shrink-0 flex flex-col items-end">
                    <button onClick={() => onDelete(b.id)}
                      className="text-[10px] text-ap-red hover:underline mb-1.5">
                      ลบ
                    </button>
                    <p className="text-[10px] text-ap-tertiary">ยอดแทง</p>
                    <p className="text-[13px] font-bold text-ap-primary tabular-nums">
                      ฿{amt.toLocaleString("th-TH")}
                    </p>
                    <p className="text-[10px] text-ap-tertiary mt-0.5">ชนะสูงสุด</p>
                    <p className="text-[12px] font-bold text-ap-green tabular-nums">
                      ฿{maxWin.toLocaleString("th-TH")}
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
                <span className="text-[12px] text-ap-secondary">จำนวนรายการ</span>
                <span className="text-[12px] font-semibold text-ap-primary">{bills.length} รายการ</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[16px] text-ap-secondary">ยอดรวมแทง</span>
                <span className="text-[22px] font-bold text-ap-primary tabular-nums">
                  ฿{totalAmount.toLocaleString("th-TH")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-ap-secondary">ชนะสูงสุด</span>
                <span className="text-[15px] font-bold text-ap-green tabular-nums">
                  ฿{totalMaxWin.toLocaleString("th-TH")}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-ap-border">
                <span className="text-[16px] text-ap-red font-semibold">⏱ ปิดรับใน</span>
                {closeAt
                  ? <CountdownTimer closeAt={closeAt} className="text-[16px] font-bold text-ap-red tabular-nums" />
                  : <span className="text-[16px] font-bold text-ap-red tabular-nums">—</span>
                }
              </div>
            </div>
            <div className="px-4 pb-4">
              <button onClick={handleOpenModal}
                className="w-full bg-ap-blue hover:bg-ap-blue-h text-white font-bold text-[14px] py-3 rounded-2xl transition-colors active:scale-[0.98]">
                ยืนยันแทงหวย
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {closedToast && (
      <Toast
        message="หวยปิดรับแล้ว ไม่สามารถแทงได้"
        type="warning"
        onClose={() => setClosedToast(false)}
      />
    )}
    </>
  );
}
