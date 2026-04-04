"use client";

import { useState, useRef, useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerAction } from "@/lib/actions";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLang } from "@/lib/i18n/context";

export interface BankOption {
  code:      number;
  name_th:   string;
  shortcode: string | null;
  image:     string | null;
}

// ─── Submit button ─────────────────────────────────────────────────────────────
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth size="lg" loading={pending}>
      {label}
    </Button>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 12 19.79 19.79 0 0 1 1.07 3.35 2 2 0 0 1 3.05 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const CardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </svg>
);
const GiftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
  </svg>
);
const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );

// ─── Bank Logo ─────────────────────────────────────────────────────────────────
function BankLogo({ bank, size }: { bank: BankOption; size: number }) {
  const [imgError, setImgError] = useState(false);
  const src = bank.image
    ? (bank.image.startsWith("http") ? bank.image : `/bank_img/${bank.image}`)
    : null;

  if (src && !imgError) {
    return (
      <div className="rounded-lg overflow-hidden flex-shrink-0 bg-white" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={bank.name_th} width={size} height={size} className="w-full h-full object-contain" onError={() => setImgError(true)} />
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-ap-blue flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <span className="text-white font-bold" style={{ fontSize: size * 0.35 }}>
        {(bank.shortcode ?? bank.name_th).slice(0, 3).toUpperCase()}
      </span>
    </div>
  );
}

// ─── Bank Select ───────────────────────────────────────────────────────────────
function BankSelect({ banks, value, onChange, placeholder, hasError }: {
  banks: BankOption[];
  value: number | null;
  onChange: (code: number) => void;
  placeholder: string;
  hasError: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = banks.find((b) => b.code === value) ?? null;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
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
          <span className="text-ap-tertiary flex-1">{placeholder}</span>
        )}
        <svg className={`w-4 h-4 text-ap-tertiary transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-ap-border rounded-2xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {banks.map((b) => (
            <button key={b.code} type="button"
              onClick={() => { onChange(b.code); setOpen(false); }}
              className={["w-full flex items-center gap-3 px-4 py-2.5 hover:bg-ap-bg transition-colors text-left",
                b.code === value ? "bg-ap-blue/5" : ""].join(" ")}>
              <BankLogo bank={b} size={28} />
              <span className="text-[14px] text-ap-primary">{b.name_th}</span>
              {b.code === value && (
                <svg className="w-4 h-4 text-ap-blue ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Password strength meter ──────────────────────────────────────────────────
function PasswordStrength({ password, labels }: {
  password: string;
  labels: { checkLen: string };
}) {
  if (!password) return null;
  const valid = password.length >= 6 && password.length <= 10;
  return (
    <div className="flex flex-col gap-1.5 animate-fade-in">
      <div className="h-1 rounded-full transition-all duration-300 w-full" style={{ background: valid ? "var(--color-ap-green, #22c55e)" : "var(--color-ap-border, #e5e7eb)" }} />
      <span className={`text-[11px] flex items-center gap-1 ${valid ? "text-ap-green" : "text-ap-tertiary"}`}>
        <span className="text-[10px]">{valid ? "✓" : "○"}</span>{labels.checkLen}
      </span>
    </div>
  );
}

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function RegisterForm({ defaultRef = "", banks = [] }: { defaultRef?: string; banks?: BankOption[] }) {
  const t = useTranslation("register");
  const { lang } = useLang();
  const [state, action] = useActionState(registerAction, {});

  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw]             = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [agreed, setAgreed]             = useState(false);
  const [refCode, setRefCode]           = useState(defaultRef.toUpperCase());
  const [firstname, setFirstname]       = useState("");
  const [lastname, setLastname]         = useState("");
  const [bankCode, setBankCode]         = useState<number | null>(null);
  const [accNo, setAccNo]               = useState("");
  const [toastMsg, setToastMsg]         = useState("");
  const [toastQueue, setToastQueue]     = useState<string[]>([]);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.fieldErrors || state.error) {
      cardRef.current?.classList.add("animate-shake");
      setTimeout(() => cardRef.current?.classList.remove("animate-shake"), 450);
    }
  }, [state]);

  useEffect(() => {
    const errors = state.fieldErrors ? Object.values(state.fieldErrors).filter((v): v is string => Boolean(v)) : [];
    const all = [...(state.error ? [state.error] : []), ...errors];
    if (!all.length) return;
    const unique = [...new Set(all)];
    setToastQueue((prev) => [...prev, ...unique]);
  }, [state.error, state.fieldErrors]);

  useEffect(() => {
    if (toastMsg || toastQueue.length === 0) return;
    setToastMsg(toastQueue[0]);
    setToastQueue((prev) => prev.slice(1));
  }, [toastMsg, toastQueue]);

  const phoneComplete   = phoneDisplay.replace(/\D/g, "").length === 10;
  const confirmMatch    = confirmPassword.length > 0 && confirmPassword === password;
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== password;
  const reqText = <span className="text-ap-red ml-1 text-[11px] font-semibold">(จำเป็น)</span>;

  // ── Success ──────────────────────────────────────────────────────────────────
  if (state.success && state.phone) {
    if (typeof window !== "undefined") window.location.href = `/${lang}/dashboard`;
    return (
      <div className="text-center py-8 animate-fade-up">
        <div className="w-20 h-20 rounded-full bg-ap-green/10 flex items-center justify-center mx-auto mb-5">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-[22px] font-bold text-ap-primary tracking-tight">{t.successTitle}</h2>
        <p className="text-[14px] text-ap-secondary mt-2">{t.successRedirect}</p>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div ref={cardRef}>
      {toastMsg && (
        <Toast
          message={toastMsg}
          type="error"
          durationMs={5000}
          onClose={() => setToastMsg("")}
        />
      )}
      <form action={action} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="lang" value={lang} />

        {/* Phone */}
        <Input
          label={<>{t.phone}{reqText}</>} name="user_name" type="tel" inputMode="tel"
          placeholder="0XX-XXX-XXXX" autoComplete="tel"
          value={phoneDisplay}
          onChange={(e) => setPhoneDisplay(formatPhone(e.target.value.replace(/\D/g, "").slice(0, 10)))}
          error={state.fieldErrors?.user_name}
          leftEl={<PhoneIcon />}
          rightEl={phoneComplete ? (
            <div className="w-5 h-5 rounded-full bg-ap-green flex items-center justify-center animate-pop-in">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : null}
          hint={!state.fieldErrors?.user_name ? t.phoneHint : undefined}
        />

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={<>{t.firstname}{reqText}</>} name="firstname" type="text"
            placeholder={t.firstnamePlaceholder} autoComplete="given-name"
            value={firstname} onChange={(e) => setFirstname(e.target.value)}
            error={state.fieldErrors?.firstname}
            leftEl={<UserIcon />}
          />
          <Input
            label={<>{t.lastname}{reqText}</>} name="lastname" type="text"
            placeholder={t.lastnamePlaceholder} autoComplete="family-name"
            value={lastname} onChange={(e) => setLastname(e.target.value)}
            error={state.fieldErrors?.lastname}
            leftEl={<UserIcon />}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <Input
            label={<>{t.password}{reqText}</>} name="password" type={showPw ? "text" : "password"}
            placeholder={t.passwordPlaceholder} autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value.slice(0, 10))}
            error={state.fieldErrors?.password}
            leftEl={<LockIcon />}
            rightEl={
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="text-ap-tertiary hover:text-ap-secondary transition-colors" tabIndex={-1}>
                <EyeIcon open={showPw} />
              </button>
            }
          />
          <PasswordStrength password={password} labels={{ checkLen: t.pwCheckLen }} />
        </div>

        {/* Confirm password */}
        <Input
          label={<>{t.confirmPassword}{reqText}</>} name="confirmPassword" type={showConfirm ? "text" : "password"}
          placeholder={t.confirmPlaceholder} autoComplete="new-password"
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value.slice(0, 10))}
          error={state.fieldErrors?.confirmPassword || (confirmMismatch ? t.confirmMismatch : undefined)}
          leftEl={<ShieldIcon />}
          rightEl={
            <div className="flex items-center gap-1.5">
              {confirmMatch && (
                <div className="w-4 h-4 rounded-full bg-ap-green flex items-center justify-center animate-pop-in">
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="text-ap-tertiary hover:text-ap-secondary transition-colors" tabIndex={-1}>
                <EyeIcon open={showConfirm} />
              </button>
            </div>
          }
        />

        {/* Bank */}
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-ap-primary">{t.bank}<span className="text-ap-red ml-1 text-[11px] font-semibold">(จำเป็น)</span></label>
          <input type="hidden" name="bank" value={bankCode ?? ""} />
          <BankSelect
            banks={banks} value={bankCode} onChange={setBankCode}
            placeholder={t.bankSelect}
            hasError={!!state.fieldErrors?.bank}
          />
          {state.fieldErrors?.bank && (
            <p className="text-[12px] text-ap-red mt-0.5">{state.fieldErrors.bank}</p>
          )}
        </div>

        {/* Account number */}
        <Input
          label={<>{t.accNo}{reqText}</>} name="acc_no" type="text" inputMode="numeric"
          placeholder={t.accNoPlaceholder}
          value={accNo} onChange={(e) => setAccNo(e.target.value.replace(/\D/g, "").slice(0, 12))}
          error={state.fieldErrors?.acc_no}
          leftEl={<CardIcon />}
        />

        {/* Referral code */}
        <div className="relative">
          <Input
            label={t.referral} name="referralCode" type="text"
            placeholder={t.referralPlaceholder} autoComplete="off"
            value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase().slice(0, 10))}
            leftEl={<GiftIcon />}
            rightEl={refCode ? (
              <button type="button" onClick={() => setRefCode("")}
                className="text-ap-tertiary hover:text-ap-secondary transition-colors text-[12px]">✕</button>
            ) : null}
            hint={refCode ? undefined : t.referralHint}
          />
          {refCode && (
            <div className="absolute right-10 top-[38px] flex items-center pointer-events-none">
              <span className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                <span className="text-white text-[9px] font-bold">🎁</span>
              </span>
            </div>
          )}
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <button type="button" onClick={() => setAgreed(!agreed)}
            className={["w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200",
              agreed ? "bg-ap-blue border-ap-blue" : "bg-white border-ap-border group-hover:border-ap-blue/40"].join(" ")}>
            {agreed && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </button>
          <span className="text-[13px] text-ap-secondary leading-relaxed select-none">
            {t.agreePrefix}{" "}
            <a href="#" className="text-ap-blue font-medium hover:opacity-70" onClick={(e) => e.stopPropagation()}>{t.termsLink}</a>
            {" "}{t.and}{" "}
            <a href="#" className="text-ap-blue font-medium hover:opacity-70" onClick={(e) => e.stopPropagation()}>{t.privacyLink}</a>
          </span>
        </label>

        {/* Global error */}
        {state.error && (
          <div className="flex items-start gap-2.5 bg-ap-red/5 border border-ap-red/20 rounded-2xl px-4 py-3 animate-fade-in">
            <div className="w-5 h-5 rounded-full bg-ap-red flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-[10px] font-bold leading-none">!</span>
            </div>
            <p className="text-[13px] text-ap-red">{state.error}</p>
          </div>
        )}

        {/* Submit */}
        <div className={agreed ? "" : "opacity-50 pointer-events-none"}>
          <SubmitButton label={t.submit} />
        </div>
      </form>

      <p className="text-center text-[13px] text-ap-secondary mt-6">
        {t.hasAccount}{" "}
        <a href={`/${lang}/login`} className="text-ap-blue font-semibold hover:opacity-70 transition-opacity">{t.loginLink}</a>
      </p>
    </div>
  );
}
