"use client";

import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { updateProfileAction } from "@/lib/actions";

interface BankOption {
  code:      number;
  name_th:   string;
  shortcode: string | null;
  bg_color:  string | null;
  filepic:   string | null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-ap-blue text-white rounded-full py-3 text-[14px] font-semibold disabled:opacity-40 hover:bg-ap-blue-h transition-all active:scale-[0.98] flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          กำลังบันทึก…
        </>
      ) : "บันทึกข้อมูล"}
    </button>
  );
}

function formatAccountInput(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 12);
}

/** Bank logo — tries filepic, falls back to shortcode badge */
function BankLogo({ bank, size }: { bank: BankOption; size: number }) {
  const [imgError, setImgError] = useState(false);
  const bgColor = bank.bg_color && bank.bg_color !== "" ? bank.bg_color : "#6b7280";

  if (bank.filepic && bank.filepic !== "" && !imgError) {
    const src = bank.filepic.startsWith("http") ? bank.filepic : `/bank_img/${bank.filepic}`;
    return (
      <div
        className="rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size, backgroundColor: bgColor }}
      >
        <Image
          src={src}
          alt={bank.name_th}
          width={size}
          height={size}
          className="object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: bgColor }}
    >
      <span className="text-white font-bold" style={{ fontSize: size * 0.3 }}>
        {(bank.shortcode ?? bank.name_th).slice(0, 3).toUpperCase()}
      </span>
    </div>
  );
}

/** Custom select dropdown with bank logo + name */
function BankSelect({
  banks,
  value,
  onChange,
  hasError,
}: {
  banks:    BankOption[];
  value:    number | null;
  onChange: (code: number) => void;
  hasError: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = banks.find((b) => b.code === value) ?? null;

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-full flex items-center gap-3 border rounded-2xl px-4 py-2.5 text-[14px] outline-none transition-all text-left bg-white",
          open ? "border-ap-blue ring-2 ring-ap-blue/10" : "",
          hasError && !open ? "border-ap-red bg-ap-red/5" : !open ? "border-ap-border" : "",
        ].join(" ")}
      >
        {selected ? (
          <>
            <BankLogo bank={selected} size={28} />
            <span className="text-ap-primary font-medium flex-1">{selected.name_th}</span>
          </>
        ) : (
          <span className="text-ap-tertiary flex-1">เลือกธนาคาร…</span>
        )}
        <svg
          className={`w-4 h-4 text-ap-tertiary transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown list */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-ap-border rounded-2xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {banks.map((b) => (
            <button
              key={b.code}
              type="button"
              onClick={() => { onChange(b.code); setOpen(false); }}
              className={[
                "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-ap-bg transition-colors text-left",
                b.code === value ? "bg-ap-blue/5" : "",
              ].join(" ")}
            >
              <BankLogo bank={b} size={28} />
              <span className="text-[14px] text-ap-primary">{b.name_th}</span>
              {b.code === value && (
                <svg className="w-4 h-4 text-ap-blue ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  open:      boolean;
  firstname?: string | null;
  lastname?:  string | null;
  banks:     BankOption[];
}

export default function CompleteProfileModal({ open, firstname: initFirstname, lastname: initLastname, banks }: Props) {
  const [visible, setVisible]         = useState(open);
  const [firstname, setFirstname] = useState(initFirstname ?? "");
  const [lastname,  setLastname]  = useState(initLastname  ?? "");
  const [bankCode, setBankCode]       = useState<number | null>(null);
  const [bankAccount, setBankAccount] = useState("");
  const [done, setDone]               = useState(false);

  const [state, action] = useActionState(updateProfileAction, {});

  useEffect(() => {
    if (state.success) {
      setDone(true);
      setTimeout(() => {
        setVisible(false);
        window.location.reload();
      }, 1200);
    }
  }, [state.success]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-up">

        {/* Header */}
        <div className="bg-ap-blue px-6 pt-6 pb-5 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-[22px] mb-3 border border-white/20">
              🏦
            </div>
            <h2 className="text-[20px] font-bold leading-tight">ตั้งค่าข้อมูลบัญชี</h2>
            <p className="text-[13px] text-white/70 mt-1">กรุณากรอกข้อมูลเพื่อรับรางวัลจากการแทง</p>
          </div>
        </div>

        {/* Success state */}
        {done ? (
          <div className="px-6 py-10 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-ap-green/10 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[17px] font-bold text-ap-primary">บันทึกสำเร็จ!</p>
            <p className="text-[13px] text-ap-secondary mt-1">กำลังโหลดข้อมูลใหม่…</p>
          </div>
        ) : (
          <form action={action} className="px-6 py-5 space-y-4">

            {/* Hidden bankCode */}
            <input type="hidden" name="bankCode" value={bankCode ?? ""} />

            {/* Global error */}
            {state.error && (
              <div className="flex items-start gap-2.5 bg-ap-red/5 border border-ap-red/20 rounded-2xl px-4 py-3">
                <div className="w-5 h-5 rounded-full bg-ap-red flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-[10px] font-bold">!</span>
                </div>
                <p className="text-[13px] text-ap-red">{state.error}</p>
              </div>
            )}

            {/* Firstname + Lastname */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-ap-secondary mb-1.5">
                  ชื่อ
                </label>
                <input
                  name="firstname"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  placeholder="ชื่อ"
                  className={[
                    "w-full border rounded-2xl px-4 py-2.5 text-[14px] text-ap-primary placeholder-ap-tertiary outline-none transition-all",
                    "focus:border-ap-blue focus:ring-2 focus:ring-ap-blue/10",
                    state.fieldErrors?.displayName ? "border-ap-red bg-ap-red/5" : "border-ap-border bg-white",
                  ].join(" ")}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-ap-secondary mb-1.5">
                  นามสกุล
                </label>
                <input
                  name="lastname"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  placeholder="นามสกุล"
                  className={[
                    "w-full border rounded-2xl px-4 py-2.5 text-[14px] text-ap-primary placeholder-ap-tertiary outline-none transition-all",
                    "focus:border-ap-blue focus:ring-2 focus:ring-ap-blue/10",
                    state.fieldErrors?.displayName ? "border-ap-red bg-ap-red/5" : "border-ap-border bg-white",
                  ].join(" ")}
                />
              </div>
              {state.fieldErrors?.displayName && (
                <p className="text-[12px] text-ap-red col-span-2 -mt-2">{state.fieldErrors.displayName}</p>
              )}
            </div>

            {/* Bank select */}
            <div>
              <label className="block text-[12px] font-semibold text-ap-secondary mb-1.5">
                ธนาคาร
              </label>
              <BankSelect
                banks={banks}
                value={bankCode}
                onChange={setBankCode}
                hasError={!!state.fieldErrors?.bankCode}
              />
              {state.fieldErrors?.bankCode && (
                <p className="text-[12px] text-ap-red mt-1">{state.fieldErrors.bankCode}</p>
              )}
            </div>

            {/* Bank account */}
            <div>
              <label className="block text-[12px] font-semibold text-ap-secondary mb-1.5">
                เลขที่บัญชี
              </label>
              <input
                name="bankAccount"
                inputMode="numeric"
                value={bankAccount}
                onChange={(e) => setBankAccount(formatAccountInput(e.target.value))}
                placeholder="กรอกเลขบัญชี 10–12 หลัก"
                className={[
                  "w-full border rounded-2xl px-4 py-2.5 text-[14px] text-ap-primary placeholder-ap-tertiary outline-none transition-all font-mono tracking-wider",
                  "focus:border-ap-blue focus:ring-2 focus:ring-ap-blue/10",
                  state.fieldErrors?.bankAccount ? "border-ap-red bg-ap-red/5" : "border-ap-border bg-white",
                ].join(" ")}
              />
              {state.fieldErrors?.bankAccount ? (
                <p className="text-[12px] text-ap-red mt-1">{state.fieldErrors.bankAccount}</p>
              ) : (
                <p className="text-[11px] text-ap-tertiary mt-1">ตัวเลขเท่านั้น ไม่ต้องใส่ขีด</p>
              )}
            </div>

            <div className="pt-1">
              <SubmitButton />
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
