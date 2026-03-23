"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changePasswordAction } from "@/lib/actions";

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
      <label className="block text-[12px] font-semibold text-ap-secondary mb-1.5">{label}</label>
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
            "w-full border rounded-2xl pl-10 pr-11 py-2.5 text-[14px] text-ap-primary outline-none transition-all",
            "focus:ring-2 focus:ring-ap-blue/10",
            error ? "border-ap-red bg-ap-red/5 focus:border-ap-red" : "border-ap-border bg-white focus:border-ap-blue",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
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
      ) : "เปลี่ยนรหัสผ่าน"}
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ChangePasswordModal({ hasPassword }: { hasPassword: boolean }) {
  const [state, action] = useActionState(changePasswordAction, {});
  const [oldPw,     setOldPw]     = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showOld,   setShowOld]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);

  // client-side confirm mismatch
  const confirmMismatch = confirmPw.length > 0 && confirmPw !== newPw;
  const confirmMatch    = confirmPw.length > 0 && confirmPw === newPw;

  useEffect(() => {
    if (state.success) {
      setOldPw(""); setNewPw(""); setConfirmPw("");
    }
  }, [state.success]);

  return (
    <div className="max-w-lg mx-auto px-5 pt-6">
      <div className="bg-white rounded-3xl border border-ap-border shadow-card overflow-hidden">

        {/* Header */}
        <div className="bg-ap-blue px-6 pt-6 pb-5 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-[22px] mb-3 border border-white/20">
              🔐
            </div>
            <h2 className="text-[20px] font-bold leading-tight">เปลี่ยนรหัสผ่าน</h2>
            <p className="text-[13px] text-white/70 mt-1">กรอกรหัสผ่านเดิมและตั้งรหัสใหม่</p>
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
            <p className="text-[17px] font-bold text-ap-primary">เปลี่ยนรหัสผ่านสำเร็จ!</p>
            <p className="text-[13px] text-ap-secondary mt-1">รหัสผ่านของคุณได้รับการอัปเดตแล้ว</p>
            <a
              href="/profile"
              className="mt-6 flex items-center justify-center w-full bg-ap-blue text-white rounded-full py-3 text-[14px] font-semibold hover:bg-ap-blue-h transition-colors"
            >
              กลับหน้าโปรไฟล์
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
                <p className="text-[13px] text-ap-red">{state.error}</p>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-ap-border" />
              <span className="text-[11px] text-ap-tertiary font-medium uppercase tracking-wide">รหัสผ่านเดิม</span>
              <div className="flex-1 h-px bg-ap-border" />
            </div>

            <PasswordField
              label="รหัสผ่านเดิม"
              name="oldPassword"
              value={oldPw}
              onChange={setOldPw}
              error={state.fieldErrors?.oldPassword}
              show={showOld}
              onToggle={() => setShowOld((v) => !v)}
            />

            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-px bg-ap-border" />
              <span className="text-[11px] text-ap-tertiary font-medium uppercase tracking-wide">รหัสผ่านใหม่</span>
              <div className="flex-1 h-px bg-ap-border" />
            </div>

            <PasswordField
              label="รหัสผ่านใหม่"
              name="newPassword"
              value={newPw}
              onChange={setNewPw}
              error={state.fieldErrors?.newPassword}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
            />

            <div>
              <label className="block text-[12px] font-semibold text-ap-secondary mb-1.5">ยืนยันรหัสผ่านใหม่</label>
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
                    "w-full border rounded-2xl pl-10 pr-11 py-2.5 text-[14px] text-ap-primary outline-none transition-all",
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
                    tabIndex={-1}
                    className="text-ap-tertiary hover:text-ap-secondary transition-colors"
                  >
                    <EyeIcon open={showConf} />
                  </button>
                </div>
              </div>
              {(state.fieldErrors?.confirmPassword || confirmMismatch) && (
                <p className="text-[12px] text-ap-red mt-1">
                  {state.fieldErrors?.confirmPassword ?? "รหัสผ่านไม่ตรงกัน"}
                </p>
              )}
            </div>

            <div className="pt-1">
              <SubmitButton />
            </div>

            <p className="text-center text-[12px] text-ap-tertiary pb-1">
              <a href="/profile" className="hover:text-ap-secondary transition-colors">← กลับหน้าโปรไฟล์</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
