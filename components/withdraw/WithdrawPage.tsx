"use client";

import { useState } from "react";

interface Props {
  displayName: string;
  bankName: string | null;
  bankAccount: string | null;
  balance: number;
}

// ─── Config (แก้ไขได้ภายหลัง) ────────────────────────────────────────────────
const MIN_WITHDRAW    = 100;
const MAX_PER_TX      = 40_000;
const MAX_PER_DAY     = 10_000_000;
const MAX_DAILY_COUNT = 10;
const COOLDOWN_MIN    = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function maskAccount(acc: string) {
  return acc.length > 4 ? `${"X".repeat(acc.length - 4)}-${acc.slice(-4)}` : acc;
}

function fmt(n: number) {
  return n.toLocaleString("th-TH");
}

// ─── Notes ────────────────────────────────────────────────────────────────────
function Notes({ usedCount, balance }: { usedCount: number; balance: number }) {
  const remaining = MAX_DAILY_COUNT - usedCount;
  const notes = [
    {
      bold: false,
      highlight: true,
      text: `คุณสามารถใช้สิทธิการถอนได้ ${MAX_DAILY_COUNT} ครั้งต่อวัน ขณะนี้คุณใช้สิทธิถอนไปแล้ว ${usedCount} ครั้ง (เหลือ ${remaining} ครั้ง)`,
    },
    { bold: false, highlight: false, text: `ถอนขั้นต่ำ ครั้งละ ${fmt(MIN_WITHDRAW)} บาท` },
    { bold: false, highlight: false, text: `ถอนสูงสุดต่อครั้ง ${fmt(MAX_PER_TX)} บาท` },
    { bold: false, highlight: false, text: `ถอนสูงสุดต่อวัน ${fmt(MAX_PER_DAY)} บาท` },
    {
      bold: true,
      highlight: false,
      text: `หากทำรายการถอนไปแล้ว โปรดรออีก ${COOLDOWN_MIN} นาทีถึงทำรายการถอนได้อีกครั้ง!!`,
    },
  ];

  return (
    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[18px]">⚠️</span>
        <p className="text-[12px] font-bold text-amber-700 uppercase tracking-wide">หมายเหตุสำคัญ</p>
      </div>
      <div className="space-y-2">
        {notes.map((n, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-amber-500 text-[12px] mt-0.5 flex-shrink-0">•</span>
            <p className={[
              "text-[12px] leading-relaxed",
              n.bold      ? "font-semibold text-amber-800" : "text-amber-700",
              n.highlight ? "font-medium"                  : "",
            ].join(" ")}>
              {n.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function WithdrawPage({ displayName, bankName, bankAccount, balance }: Props) {
  const [amount,  setAmount]  = useState("");
  const [done,    setDone]    = useState(false);
  const [usedCount] = useState(0); // TODO: ดึงจาก DB จริง

  const amountNum    = parseFloat(amount) || 0;
  const isValid      = amountNum >= MIN_WITHDRAW && amountNum <= Math.min(MAX_PER_TX, balance);

  const quickAmounts = [
    { label: "100",    value: 100 },
    { label: "300",    value: 300 },
    { label: "500",    value: 500 },
    { label: "ทั้งหมด", value: balance },
  ];

  function getAmountError(): string | null {
    if (!amount) return null;
    if (amountNum < MIN_WITHDRAW)       return `ถอนขั้นต่ำ ${fmt(MIN_WITHDRAW)} บาท`;
    if (amountNum > MAX_PER_TX)         return `ถอนสูงสุดต่อครั้ง ${fmt(MAX_PER_TX)} บาท`;
    if (amountNum > balance)            return "ยอดคงเหลือไม่เพียงพอ";
    return null;
  }

  const amountError = getAmountError();

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-6">
        <div className="bg-white rounded-3xl border border-ap-border shadow-card p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-ap-green/10 flex items-center justify-center mx-auto mb-5">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-[22px] font-bold text-ap-primary">ส่งคำขอถอนเงินแล้ว!</h2>
          <p className="text-[13px] text-ap-secondary mt-1.5">
            ระบบกำลังดำเนินการ รอไม่เกิน {COOLDOWN_MIN} นาที
          </p>

          <div className="mt-5 bg-ap-bg rounded-2xl p-4 text-left space-y-2.5">
            {[
              { label: "จำนวนเงิน",  value: `฿${fmt(amountNum)}`,                blue: true },
              { label: "โอนเข้าบัญชี", value: bankName ?? "-" },
              { label: "เลขบัญชี",   value: bankAccount ? maskAccount(bankAccount) : "-" },
              { label: "ชื่อบัญชี",  value: displayName },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-[13px] text-ap-secondary">{row.label}</span>
                <span className={`text-[13px] font-semibold ${row.blue ? "text-ap-blue" : "text-ap-primary"}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <a
            href="/profile"
            className="mt-5 flex items-center justify-center w-full bg-ap-blue text-white rounded-full py-3.5 text-[15px] font-semibold hover:bg-ap-blue-h transition-colors"
          >
            กลับหน้าโปรไฟล์
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-6">

      {/* Balance card */}
      <div className="bg-white rounded-2xl border border-ap-border shadow-card px-5 py-4 mb-3">
        <p className="text-[11px] text-ap-tertiary uppercase tracking-wide font-medium mb-0.5">ยอดคงเหลือ</p>
        <p className="text-[30px] font-bold text-ap-primary tabular-nums leading-tight">
          ฿{balance.toFixed(2)}
        </p>
      </div>

      {/* Bank info card */}
      <div className="bg-white rounded-2xl border border-ap-border shadow-card px-5 py-4 mb-5">
        <p className="text-[11px] text-ap-tertiary uppercase tracking-wide font-medium mb-1.5">บัญชีรับเงินของฉัน</p>
        {bankAccount ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-ap-primary">{displayName}</p>
              <p className="text-[12px] text-ap-secondary mt-0.5">{bankName}</p>
            </div>
            <p className="text-[14px] font-mono font-semibold text-ap-primary tracking-wider">
              {maskAccount(bankAccount)}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-ap-tertiary">ยังไม่ได้ผูกบัญชีธนาคาร</p>
            <a href="/profile" className="text-[12px] text-ap-blue font-semibold">ตั้งค่า →</a>
          </div>
        )}
      </div>

      {/* Form card */}
      <div className="bg-white rounded-3xl border border-ap-border shadow-card p-5 space-y-5">
        <h2 className="text-[17px] font-bold text-ap-primary">ระบุจำนวนเงินที่ต้องการถอน</h2>

        {/* Quick-amount buttons */}
        <div className="grid grid-cols-4 gap-2">
          {quickAmounts.map((q) => {
            const isAll      = q.label === "ทั้งหมด";
            const selected   = isAll
              ? parseFloat(amount) === balance
              : amount === String(q.value);
            return (
              <button
                key={q.label}
                onClick={() => setAmount(String(q.value))}
                className={[
                  "py-2.5 rounded-xl text-[13px] font-bold border-2 transition-all active:scale-95",
                  selected
                    ? "bg-ap-blue border-ap-blue text-white shadow-sm"
                    : "bg-white border-ap-border text-ap-primary hover:border-ap-blue/40",
                ].join(" ")}
              >
                {q.label}
              </button>
            );
          })}
        </div>

        {/* Custom input */}
        <div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] font-bold text-ap-secondary select-none">฿</span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_WITHDRAW}
              max={Math.min(MAX_PER_TX, balance)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`กรอกจำนวนเงิน (ขั้นต่ำ ${fmt(MIN_WITHDRAW)} บาท)`}
              className={[
                "w-full border-2 rounded-2xl pl-9 pr-4 py-3 text-[15px] font-semibold text-ap-primary outline-none transition-all",
                amountError
                  ? "border-ap-red bg-ap-red/[0.03] focus:ring-2 focus:ring-ap-red/10"
                  : "border-ap-border focus:border-ap-blue focus:ring-2 focus:ring-ap-blue/10",
              ].join(" ")}
            />
          </div>
          {amountError && (
            <p className="text-[12px] text-ap-red mt-1.5 pl-1">{amountError}</p>
          )}
        </div>

        {/* Summary row */}
        {isValid && (
          <div className="bg-ap-bg rounded-xl px-4 py-3 flex items-center justify-between animate-fade-in">
            <span className="text-[12px] text-ap-secondary">จะโอนเข้า</span>
            <span className="text-[13px] font-semibold text-ap-primary">
              {displayName} · {bankAccount ? maskAccount(bankAccount) : "-"}
            </span>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={() => setDone(true)}
          disabled={!isValid || !bankAccount}
          className="w-full py-3.5 rounded-full bg-ap-red text-white text-[15px] font-semibold hover:opacity-90 transition-all disabled:opacity-40 active:scale-[0.99]"
        >
          {!bankAccount ? "กรุณาผูกบัญชีธนาคารก่อน" : `ยืนยันถอน ฿${isValid ? fmt(amountNum) : "–"}`}
        </button>
      </div>

      <Notes usedCount={usedCount} balance={balance} />
    </div>
  );
}
