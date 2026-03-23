"use client";

import { useState, useRef } from "react";

interface Props {
  displayName: string;
  bankName: string | null;
  bankAccount: string | null;
  balance: number;
}

// บัญชีรับเงินของระบบ
const ADMIN_BANK = {
  bankName:      "ธนาคารกสิกรไทย (KBANK)",
  accountNumber: "123-4-56789-0",
  accountName:   "บริษัท ลอตโต้ออนไลน์ จำกัด",
};

const QUICK_AMOUNTS = [50, 100, 300, 500, 1000];

type Method = "transfer" | "qr";

// phase กำหนด flow ทั้งหมด — QR มี "qr" phase เพิ่ม
type Phase = "method" | "amount" | "qr" | "slip" | "done";

// map phase → visual step number ต่างกันตาม method
function toVisualStep(phase: Phase, method: Method | null): number {
  if (method === "qr") {
    return { method: 1, amount: 2, qr: 3, slip: 4, done: 5 }[phase];
  }
  return { method: 1, amount: 2, qr: 2, slip: 3, done: 4 }[phase];
}

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ phase, method }: { phase: Phase; method: Method | null }) {
  const steps =
    method === "qr"
      ? ["เลือกวิธี", "จำนวนเงิน", "QR Code", "แนบสลิป", "สำเร็จ"]
      : ["เลือกวิธี", "จำนวนเงิน", "แนบสลิป", "สำเร็จ"];

  const current = toVisualStep(phase, method);

  return (
    <div className="flex items-center mb-7">
      {steps.map((label, i) => {
        const n      = i + 1;
        const done   = current > n;
        const active = current === n;
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={[
                "w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300",
                done   ? "bg-ap-green text-white shadow-sm"
                : active ? "bg-ap-blue text-white shadow-sm"
                :          "bg-ap-border text-ap-tertiary",
              ].join(" ")}>
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : n}
              </div>
              <span className={[
                "text-[10px] font-medium whitespace-nowrap",
                active ? "text-ap-blue" : done ? "text-ap-green" : "text-ap-tertiary",
              ].join(" ")}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={[
                "flex-1 h-0.5 mx-1.5 mb-4 rounded-full transition-all duration-300",
                current > n ? "bg-ap-green" : "bg-ap-border",
              ].join(" ")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Notes ────────────────────────────────────────────────────────────────────
function Notes() {
  return (
    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[18px]">⚠️</span>
        <p className="text-[12px] font-bold text-amber-700 uppercase tracking-wide">หมายเหตุสำคัญ</p>
      </div>
      <div className="space-y-1.5">
        {[
          { bold: true,  text: "ใช้บัญชีที่ลงทะเบียนไว้ในการฝากเงินเท่านั้น !!!!" },
          { bold: false, text: "หลังจากฝากเงินสำเร็จ รอไม่เกิน 1–3 นาที" },
          { bold: false, text: "หากพบปัญหาติดต่อฝ่ายบริการลูกค้า" },
        ].map((n, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-amber-500 text-[12px] mt-0.5 flex-shrink-0">•</span>
            <p className={`text-[12px] text-amber-700 leading-relaxed ${n.bold ? "font-semibold" : ""}`}>
              {n.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DepositPage({ displayName, bankName, bankAccount, balance }: Props) {
  const [phase,       setPhase]       = useState<Phase>("method");
  const [method,      setMethod]      = useState<Method | null>(null);
  const [amount,      setAmount]      = useState("");
  const [slip,        setSlip]        = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const amountNum     = parseFloat(amount) || 0;
  const isValidAmount = amountNum >= 50;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSlip(file);
    const reader = new FileReader();
    reader.onload = () => setSlipPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function maskAccount(acc: string) {
    return acc.length > 4 ? `${"X".repeat(acc.length - 4)}-${acc.slice(-4)}` : acc;
  }

  // ปุ่ม "ถัดไป" จาก amount: QR → phase qr, transfer → phase slip
  function onAmountNext() {
    setPhase(method === "qr" ? "qr" : "slip");
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
        <p className="text-[11px] text-ap-tertiary uppercase tracking-wide font-medium mb-1.5">บัญชีธนาคารของฉัน</p>
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
          <p className="text-[13px] text-ap-tertiary">ยังไม่ได้ผูกบัญชีธนาคาร</p>
        )}
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl border border-ap-border shadow-card p-5">
        <StepBar phase={phase} method={method} />

        {/* ── Phase: method ────────────────────────────────────────────────── */}
        {phase === "method" && (
          <div className="space-y-3 animate-fade-up">
            <h2 className="text-[17px] font-bold text-ap-primary mb-4">เลือกวิธีฝากเงิน</h2>
            {([
              { id: "transfer" as Method, icon: "🏦", title: "โอนผ่านเลขบัญชี",    desc: "โอนผ่านธนาคาร / Mobile Banking" },
              { id: "qr"       as Method, icon: "📱", title: "QR Code / PromptPay", desc: "สแกน QR พร้อมเพย์" },
            ] as const).map((m) => (
              <button
                key={m.id}
                onClick={() => { setMethod(m.id); setPhase("amount"); }}
                className="w-full flex items-center gap-4 border-2 border-ap-border rounded-2xl px-5 py-4 text-left hover:border-ap-blue/50 hover:bg-ap-blue/[0.02] transition-all active:scale-[0.99] group"
              >
                <div className="w-12 h-12 rounded-2xl bg-ap-bg flex items-center justify-center text-[24px] flex-shrink-0 group-hover:bg-ap-blue/5 transition-colors">
                  {m.icon}
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-semibold text-ap-primary">{m.title}</p>
                  <p className="text-[12px] text-ap-tertiary mt-0.5">{m.desc}</p>
                </div>
                <svg className="w-5 h-5 text-ap-tertiary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* ── Phase: amount ─────────────────────────────────────────────────── */}
        {phase === "amount" && (
          <div className="space-y-4 animate-fade-up">

            {/* สำหรับ transfer: แสดงบัญชีรับเงิน / สำหรับ QR: แสดง hint */}
            {method === "transfer" ? (
              <div className="bg-ap-blue/5 border border-ap-blue/20 rounded-2xl p-4">
                <p className="text-[11px] text-ap-blue font-bold uppercase tracking-wide mb-3">โอนเงินมาที่บัญชีนี้</p>
                <div className="space-y-2">
                  {[
                    { label: "ธนาคาร",    value: ADMIN_BANK.bankName },
                    { label: "เลขบัญชี", value: ADMIN_BANK.accountNumber, mono: true },
                    { label: "ชื่อบัญชี", value: ADMIN_BANK.accountName },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-4">
                      <span className="text-[12px] text-ap-secondary flex-shrink-0">{row.label}</span>
                      <span className={`text-[13px] font-semibold text-ap-primary text-right ${row.mono ? "font-mono tracking-wider" : ""}`}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 bg-ap-blue/5 border border-ap-blue/20 rounded-2xl px-4 py-3">
                <span className="text-[18px]">📱</span>
                <p className="text-[13px] text-ap-blue font-medium">
                  ระบุจำนวนเงิน แล้วระบบจะสร้าง QR ให้สแกน
                </p>
              </div>
            )}

            <h2 className="text-[16px] font-bold text-ap-primary">ระบุจำนวนเงิน</h2>

            {/* Quick-amount buttons */}
            <div className="grid grid-cols-5 gap-2">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className={[
                    "py-2.5 rounded-xl text-[13px] font-bold border-2 transition-all active:scale-95",
                    amount === String(q)
                      ? "bg-ap-blue border-ap-blue text-white shadow-sm"
                      : "bg-white border-ap-border text-ap-primary hover:border-ap-blue/40",
                  ].join(" ")}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] font-bold text-ap-secondary select-none">฿</span>
              <input
                type="number"
                inputMode="numeric"
                min={50}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="กรอกจำนวนเงิน (ขั้นต่ำ 50 บาท)"
                className="w-full border-2 border-ap-border rounded-2xl pl-9 pr-4 py-3 text-[15px] font-semibold text-ap-primary outline-none focus:border-ap-blue focus:ring-2 focus:ring-ap-blue/10 transition-all"
              />
            </div>
            {amount !== "" && !isValidAmount && (
              <p className="text-[12px] text-ap-red -mt-2">จำนวนขั้นต่ำ 50 บาท</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setPhase("method")}
                className="flex-1 py-3 rounded-full border-2 border-ap-border text-[14px] font-semibold text-ap-secondary hover:border-ap-blue/30 transition-colors"
              >
                ← ย้อนกลับ
              </button>
              <button
                onClick={onAmountNext}
                disabled={!isValidAmount}
                className="flex-1 py-3 rounded-full bg-ap-blue text-white text-[14px] font-semibold hover:bg-ap-blue-h transition-all disabled:opacity-40"
              >
                {method === "qr" ? "สร้าง QR Code →" : "ถัดไป →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Phase: qr (QR only) ───────────────────────────────────────────── */}
        {phase === "qr" && (
          <div className="space-y-4 animate-fade-up">
            <div>
              <h2 className="text-[17px] font-bold text-ap-primary">สแกน QR เพื่อชำระเงิน</h2>
              <p className="text-[13px] text-ap-secondary mt-1">
                จำนวน{" "}
                <span className="font-bold text-ap-blue">฿{parseFloat(amount).toLocaleString("th-TH")}</span>
              </p>
            </div>

            {/* QR display */}
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-52 h-52 bg-white border-2 border-ap-border rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm">
                {/* QR placeholder — ในระบบจริงใช้ library สร้าง QR */}
                <div className="grid grid-cols-3 gap-1 opacity-60">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-sm ${[0,2,6,8].includes(i) ? "bg-ap-primary" : i === 4 ? "bg-ap-blue" : "bg-ap-border"}`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-ap-tertiary font-medium">QR PromptPay</p>
              </div>
              <div className="text-center">
                <p className="text-[13px] font-semibold text-ap-primary">
                  ฿{parseFloat(amount).toLocaleString("th-TH")}
                </p>
                <p className="text-[11px] text-ap-tertiary mt-0.5">สแกนผ่าน Mobile Banking ของคุณ</p>
              </div>
            </div>

            {/* ชื่อผู้รับ */}
            <div className="bg-ap-bg rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-[12px] text-ap-secondary">ผู้รับเงิน</span>
              <span className="text-[13px] font-semibold text-ap-primary">{ADMIN_BANK.accountName}</span>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setPhase("amount")}
                className="flex-1 py-3 rounded-full border-2 border-ap-border text-[14px] font-semibold text-ap-secondary hover:border-ap-blue/30 transition-colors"
              >
                ← ย้อนกลับ
              </button>
              <button
                onClick={() => setPhase("slip")}
                className="flex-1 py-3 rounded-full bg-ap-blue text-white text-[14px] font-semibold hover:bg-ap-blue-h transition-all"
              >
                สแกนแล้ว → แนบสลิป
              </button>
            </div>
          </div>
        )}

        {/* ── Phase: slip ───────────────────────────────────────────────────── */}
        {phase === "slip" && (
          <div className="space-y-4 animate-fade-up">
            <div>
              <h2 className="text-[17px] font-bold text-ap-primary">แนบสลิปการโอนเงิน</h2>
              <p className="text-[13px] text-ap-secondary mt-1">
                ยอดที่ฝาก{" "}
                <span className="font-bold text-ap-blue">฿{parseFloat(amount).toLocaleString("th-TH")}</span>
                {" "}· {method === "qr" ? "QR Code / PromptPay" : "โอนผ่านบัญชี"}
              </p>
            </div>

            {/* Upload zone */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={[
                "w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center gap-3 transition-all",
                slipPreview
                  ? "border-ap-green bg-ap-green/[0.03]"
                  : "border-ap-border bg-ap-bg hover:border-ap-blue/40 hover:bg-ap-blue/[0.02]",
              ].join(" ")}
            >
              {slipPreview ? (
                <>
                  <img src={slipPreview} alt="slip preview" className="max-h-52 rounded-xl object-contain shadow-sm" />
                  <p className="text-[12px] text-ap-green font-semibold">แนบสลิปแล้ว — แตะเพื่อเปลี่ยน</p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-white border border-ap-border flex items-center justify-center text-[28px] shadow-sm">
                    📎
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-semibold text-ap-primary">แตะเพื่อแนบสลิป</p>
                    <p className="text-[12px] text-ap-tertiary mt-0.5">รองรับ JPG, PNG, PDF</p>
                  </div>
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setPhase(method === "qr" ? "qr" : "amount")}
                className="flex-1 py-3 rounded-full border-2 border-ap-border text-[14px] font-semibold text-ap-secondary hover:border-ap-blue/30 transition-colors"
              >
                ← ย้อนกลับ
              </button>
              <button
                onClick={() => setPhase("done")}
                disabled={!slip}
                className="flex-1 py-3 rounded-full bg-ap-blue text-white text-[14px] font-semibold hover:bg-ap-blue-h transition-all disabled:opacity-40"
              >
                ยืนยันฝากเงิน
              </button>
            </div>
          </div>
        )}

        {/* ── Phase: done ───────────────────────────────────────────────────── */}
        {phase === "done" && (
          <div className="text-center py-4 animate-fade-up">
            <div className="w-20 h-20 rounded-full bg-ap-green/10 flex items-center justify-center mx-auto mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-[22px] font-bold text-ap-primary">ส่งคำขอฝากเงินแล้ว!</h2>
            <p className="text-[13px] text-ap-secondary mt-1.5">ระบบกำลังตรวจสอบสลิปของคุณ</p>

            <div className="mt-5 bg-ap-bg rounded-2xl p-4 text-left space-y-2.5">
              {[
                { label: "จำนวนเงิน", value: `฿${parseFloat(amount).toLocaleString("th-TH")}`, blue: true },
                { label: "วิธีฝาก",  value: method === "qr" ? "QR Code / PromptPay" : "โอนผ่านเลขบัญชี" },
                { label: "ชื่อบัญชี", value: displayName },
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
        )}
      </div>

      {/* Notes */}
      {phase !== "done" && <Notes />}
    </div>
  );
}
