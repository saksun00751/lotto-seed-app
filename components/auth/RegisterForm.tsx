"use client";

import { useState, useRef, useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerAction } from "@/lib/actions";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

// ─── Submit button with pending state ────────────────────────────────────────
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth size="lg" loading={pending}>
      สมัครสมาชิก
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

// ─── Password strength meter ──────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { label: "8 ตัวอักษรขึ้นไป", pass: password.length >= 8 },
    { label: "มีตัวอักษร A–Z", pass: /[A-Za-z]/.test(password) },
    { label: "มีตัวเลข 0–9", pass: /[0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.pass).length;
  const levels = ["", "อ่อน", "ปานกลาง", "แข็งแกร่ง"];
  const colors = ["", "bg-ap-red", "bg-yellow-400", "bg-ap-green"];
  const textColors = ["", "text-ap-red", "text-yellow-500", "text-ap-green"];

  return (
    <div className="flex flex-col gap-2 animate-fade-in">
      {/* Bar */}
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? colors[score] : "bg-ap-border"
            }`}
          />
        ))}
      </div>
      {/* Label + checklist */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {checks.map((c) => (
            <span
              key={c.label}
              className={`text-[11px] flex items-center gap-1 transition-colors ${
                c.pass ? "text-ap-green" : "text-ap-tertiary"
              }`}
            >
              <span className="text-[10px]">{c.pass ? "✓" : "○"}</span>
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-[11px] font-semibold ${textColors[score]}`}>
            {levels[score]}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}

// ─── Gift icon ────────────────────────────────────────────────────────────────
const GiftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
  </svg>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export default function RegisterForm({ defaultRef = "" }: { defaultRef?: string }) {
  const [state, action] = useActionState(registerAction, {});

  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [refCode, setRefCode] = useState(defaultRef.toUpperCase());

  const cardRef = useRef<HTMLDivElement>(null);

  // Shake on server error
  useEffect(() => {
    if (state.fieldErrors || state.error) {
      cardRef.current?.classList.add("animate-shake");
      setTimeout(() => cardRef.current?.classList.remove("animate-shake"), 450);
    }
  }, [state]);

  const phoneDigits = phoneDisplay.replace(/\D/g, "");
  const phoneComplete = phoneDigits.length === 10;

  // Derived confirm match indicator
  const confirmMatch =
    confirmPassword.length > 0 && confirmPassword === password;
  const confirmMismatch =
    confirmPassword.length > 0 && confirmPassword !== password;

  // ── Success screen — auto-redirect to dashboard ─────────────────────────────
  if (state.success && state.phone) {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
    return (
      <div className="text-center py-8 animate-fade-up">
        <div className="w-20 h-20 rounded-full bg-ap-green/10 flex items-center justify-center mx-auto mb-5">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-[22px] font-bold text-ap-primary tracking-tight">สมัครสมาชิกสำเร็จ! 🎉</h2>
        <p className="text-[14px] text-ap-secondary mt-2">กำลังเข้าสู่ระบบ…</p>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div ref={cardRef}>
      <form action={action} className="flex flex-col gap-5" noValidate>
        {/* Phone */}
        <Input
          label="เบอร์โทรศัพท์"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="0XX-XXX-XXXX"
          autoComplete="tel"
          value={phoneDisplay}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(0, 10);
            setPhoneDisplay(formatPhone(d));
          }}
          error={state.fieldErrors?.phone}
          leftEl={<PhoneIcon />}
          rightEl={
            phoneComplete ? (
              <div className="w-5 h-5 rounded-full bg-ap-green flex items-center justify-center animate-pop-in">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ) : null
          }
          hint={!state.fieldErrors?.phone ? "รองรับเบอร์ AIS, DTAC, TRUE, NT" : undefined}
        />

        {/* Password */}
        <div className="flex flex-col gap-2">
          <Input
            label="รหัสผ่าน"
            name="password"
            type={showPw ? "text" : "password"}
            placeholder="อย่างน้อย 8 ตัว มีตัวเลขด้วย"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={state.fieldErrors?.password}
            leftEl={<LockIcon />}
            rightEl={
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="text-ap-tertiary hover:text-ap-secondary transition-colors"
                tabIndex={-1}
              >
                <EyeIcon open={showPw} />
              </button>
            }
          />
          <PasswordStrength password={password} />
        </div>

        {/* Confirm password */}
        <Input
          label="ยืนยันรหัสผ่าน"
          name="confirmPassword"
          type={showConfirm ? "text" : "password"}
          placeholder="กรอกรหัสผ่านอีกครั้ง"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={
            state.fieldErrors?.confirmPassword ||
            (confirmMismatch ? "รหัสผ่านไม่ตรงกัน" : undefined)
          }
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
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="text-ap-tertiary hover:text-ap-secondary transition-colors"
                tabIndex={-1}
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
          }
        />

        {/* Referral code (optional) */}
        <div className="relative">
          <Input
            label="รหัสแนะนำ (ถ้ามี)"
            name="referralCode"
            type="text"
            placeholder="เช่น LTABCD12"
            autoComplete="off"
            value={refCode}
            onChange={(e) => setRefCode(e.target.value.toUpperCase().slice(0, 10))}
            leftEl={<GiftIcon />}
            rightEl={
              refCode ? (
                <button
                  type="button"
                  onClick={() => setRefCode("")}
                  className="text-ap-tertiary hover:text-ap-secondary transition-colors text-[12px]"
                >
                  ✕
                </button>
              ) : null
            }
            hint={refCode ? undefined : "ไม่บังคับ — กรอกเฉพาะถ้ามีคนแนะนำ"}
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
          <button
            type="button"
            onClick={() => setAgreed(!agreed)}
            className={[
              "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200",
              agreed
                ? "bg-ap-blue border-ap-blue"
                : "bg-white border-ap-border group-hover:border-ap-blue/40",
            ].join(" ")}
          >
            {agreed && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className="text-[13px] text-ap-secondary leading-relaxed select-none">
            ฉันได้อ่านและยอมรับ{" "}
            <a href="#" className="text-ap-blue font-medium hover:opacity-70" onClick={(e) => e.stopPropagation()}>
              ข้อกำหนดการใช้งาน
            </a>{" "}
            และ{" "}
            <a href="#" className="text-ap-blue font-medium hover:opacity-70" onClick={(e) => e.stopPropagation()}>
              นโยบายความเป็นส่วนตัว
            </a>
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

        {/* Submit — disabled until terms agreed */}
        <div className={agreed ? "" : "opacity-50 pointer-events-none"}>
          <SubmitButton />
        </div>
      </form>

      {/* Login link */}
      <p className="text-center text-[13px] text-ap-secondary mt-6">
        มีบัญชีอยู่แล้ว?{" "}
        <a href="/login" className="text-ap-blue font-semibold hover:opacity-70 transition-opacity">
          เข้าสู่ระบบ
        </a>
      </p>
    </div>
  );
}
