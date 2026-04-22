"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changePasswordAction } from "@/lib/actions";
import { useLang } from "@/lib/i18n/context";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Toast from "@/components/ui/Toast";

// ─── Icons ────────────────────────────────────────────────────────────────────
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );

// ─── Password field ───────────────────────────────────────────────────────────
function PasswordField({
  label, name, value, onChange, error, show, onToggle,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="block text-[14px] font-bold text-ap-secondary mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ap-tertiary">
          <LockIcon />
        </span>
        <input
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          className={[
            "w-full border rounded-2xl pl-10 pr-11 py-3 text-[16px] font-semibold text-ap-primary outline-none transition-all",
            "focus:ring-2 focus:ring-ap-blue/10",
            error ? "border-ap-red bg-ap-red/5 focus:border-ap-red" : "border-ap-border bg-white focus:border-ap-blue",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-ap-tertiary hover:text-ap-secondary transition-colors"
        >
          <EyeIcon open={show} />
        </button>
      </div>
      {error && <p className="text-[12px] text-ap-red mt-1">{error}</p>}
    </div>
  );
}

// ─── Submit button ────────────────────────────────────────────────────────────
function SubmitButton({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-ap-blue text-white rounded-full py-3 text-[16px] font-bold disabled:opacity-40 hover:bg-ap-blue-h transition-all active:scale-[0.98] flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {savingLabel}
        </>
      ) : label}
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ChangePasswordModal({ hasPassword: _hasPassword }: { hasPassword: boolean }) {
  const { lang } = useLang();
  const t = useTranslation("changePassword");
  const [state, action] = useActionState(changePasswordAction, {});
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew,   setShowNew]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const confirmMismatch = confirmPw.length > 0 && confirmPw !== newPw;
  const confirmMatch    = confirmPw.length > 0 && confirmPw === newPw;

  useEffect(() => {
    if (state.success) {
      setNewPw(""); setConfirmPw("");
    }
  }, [state.success]);

  useEffect(() => {
    if (state.error) setToast({ text: state.error, type: "error" });
    else if (state.success) setToast({ text: t.successTitle, type: "success" });
  }, [state.error, state.success, t.successTitle]);

  return (
    <div className="max-w-5xl mx-auto px-5 pt-6">
      {toast && (
        <Toast
          message={toast.text}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="bg-white rounded-3xl border border-ap-border shadow-card overflow-hidden">

        {/* Header */}
        <div className="bg-ap-blue px-6 pt-6 pb-5 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-[22px] mb-3 border border-white/20">
              🔐
            </div>
            <h2 className="text-[24px] font-bold leading-tight">{t.title}</h2>
            <p className="text-[15px] font-semibold text-white/90 mt-1">{t.subtitle}</p>
          </div>
        </div>

        {/* Success */}
        {state.success ? (
          <div className="px-6 py-10 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-ap-green/10 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[19px] font-bold text-ap-primary">{t.successTitle}</p>
            <p className="text-[15px] font-semibold text-ap-secondary mt-1">{t.successDesc}</p>
            <a
              href={`/${lang}/profile`}
              className="mt-6 flex items-center justify-center w-full bg-ap-blue text-white rounded-full py-3 text-[16px] font-bold hover:bg-ap-blue-h transition-colors"
            >
              {t.backProfile}
            </a>
          </div>
        ) : (
          <form action={action} className="px-6 py-5 space-y-4">

            {/* Global error */}
            {state.error && (
              <div className="flex items-start gap-2.5 bg-ap-red/5 border border-ap-red/20 rounded-2xl px-4 py-3">
                <div className="w-5 h-5 rounded-full bg-ap-red flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-[10px] font-bold">!</span>
                </div>
                <p className="text-[15px] font-semibold text-ap-red">{state.error}</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-px bg-ap-border" />
              <span className="text-[13px] text-ap-tertiary font-bold uppercase tracking-wide">{t.sectionNew}</span>
              <div className="flex-1 h-px bg-ap-border" />
            </div>

            <PasswordField
              label={t.labelNew}
              name="newPassword"
              value={newPw}
              onChange={setNewPw}
              error={state.fieldErrors?.newPassword}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
            />

            <div>
              <label className="block text-[12px] font-semibold text-ap-secondary mb-1.5">{t.labelConfirm}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ap-tertiary">
                  <LockIcon />
                </span>
                <input
                  name="confirmPassword"
                  type={showConf ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  autoComplete="off"
                  className={[
                    "w-full border rounded-2xl pl-10 pr-11 py-3 text-[16px] font-semibold text-ap-primary outline-none transition-all",
                    "focus:ring-2",
                    confirmMismatch || state.fieldErrors?.confirmPassword
                      ? "border-ap-red bg-ap-red/5 focus:border-ap-red focus:ring-ap-red/10"
                      : confirmMatch
                        ? "border-ap-green bg-ap-green/5 focus:border-ap-green focus:ring-ap-green/10"
                        : "border-ap-border bg-white focus:border-ap-blue focus:ring-ap-blue/10",
                  ].join(" ")}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {confirmMatch && (
                    <div className="w-4 h-4 rounded-full bg-ap-green flex items-center justify-center">
                      <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConf((v) => !v)}
                    aria-label={showConf ? "ซ่อนรหัสผ่านยืนยัน" : "แสดงรหัสผ่านยืนยัน"}
                    className="text-ap-tertiary hover:text-ap-secondary transition-colors"
                  >
                    <EyeIcon open={showConf} />
                  </button>
                </div>
              </div>
              {(state.fieldErrors?.confirmPassword || confirmMismatch) && (
                <p className="text-[14px] font-semibold text-ap-red mt-1">
                  {state.fieldErrors?.confirmPassword ?? t.mismatch}
                </p>
              )}
            </div>

            <div className="pt-1">
              <SubmitButton label={t.submit} savingLabel={t.saving} />
            </div>

            <p className="text-center text-[14px] font-semibold text-ap-tertiary pb-1">
              <a href={`/${lang}/profile`} className="hover:text-ap-secondary transition-colors">← {t.backProfile}</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
