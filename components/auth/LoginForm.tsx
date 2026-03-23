"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
  ClipboardEvent,
} from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestOtpAction, verifyOtpAction, loginWithPasswordAction } from "@/lib/actions";
import type { LoginStep } from "@/types/auth";
import Input from "@/components/ui/Input";

function SubmitButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full bg-ap-blue text-white rounded-full py-3.5 text-[15px] font-semibold disabled:opacity-40 hover:bg-ap-blue-h transition-all active:scale-[0.98] flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          กรุณารอสักครู่…
        </>
      ) : children}
    </button>
  );
}

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

function OtpInputRow({ value, onChange, error }: { value: string[]; onChange: (v: string[]) => void; error: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (i: number) => refs.current[i]?.focus();

  const handleInput = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...value]; next[i] = digit; onChange(next);
    if (digit && i < 5) focus(i + 1);
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[i]) { const n = [...value]; n[i] = ""; onChange(n); } else if (i > 0) focus(i - 1);
    }
    if (e.key === "ArrowLeft" && i > 0) focus(i - 1);
    if (e.key === "ArrowRight" && i < 5) focus(i + 1);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    const next = [...value]; digits.forEach((d, i) => { next[i] = d; }); onChange(next);
    focus(Math.min(digits.length, 5));
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className={`otp-input ${value[i] ? "filled" : ""} ${error ? "error" : ""}`}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  const [active, setActive] = useState(true);
  useEffect(() => {
    if (!active || remaining <= 0) { setActive(false); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, active]);
  const reset = useCallback(() => { setRemaining(seconds); setActive(true); }, [seconds]);
  return { remaining, expired: !active, reset };
}

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}

function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  return `${d.slice(0, 3)}-${d.slice(3, 5)}X-XXXX`;
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-ap-red/5 border border-ap-red/20 rounded-2xl px-4 py-3 animate-fade-in">
      <div className="w-5 h-5 rounded-full bg-ap-red flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-white text-[10px] font-bold leading-none">!</span>
      </div>
      <p className="text-[13px] text-ap-red">{msg}</p>
    </div>
  );
}

type LoginMode = "password" | "otp" ;

export default function LoginForm() {
  const [mode, setMode] = useState<LoginMode>("password");
  const [step, setStep] = useState<LoginStep>("input");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otpPhone, setOtpPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [otpError, setOtpError] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { remaining, expired, reset: resetCountdown } = useCountdown(60);

  const [reqState, reqAction] = useActionState(requestOtpAction, {});
  const [verifyState, verifyAction] = useActionState(verifyOtpAction, {});
  const [pwState, pwAction] = useActionState(loginWithPasswordAction, {});

  function shake() {
    cardRef.current?.classList.add("animate-shake");
    setTimeout(() => cardRef.current?.classList.remove("animate-shake"), 450);
  }

  useEffect(() => {
    if (reqState.success && reqState.phone) {
      setOtpPhone(reqState.phone); setStep("otp");
      setOtpDigits(Array(6).fill("")); setOtpError(""); resetCountdown();
    }
    if (reqState.error) shake();
  }, [reqState]);

  useEffect(() => {
    if (verifyState.success) setStep("success");
    if (verifyState.error) { setOtpError(verifyState.error); setOtpDigits(Array(6).fill("")); shake(); }
  }, [verifyState]);

  useEffect(() => {
    if (pwState.success) setStep("success");
    if (pwState.error || pwState.fieldErrors) shake();
  }, [pwState]);

  // ตรวจสอบ Query Param ว่าเซสชันหมดอายุหรือไม่
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired") === "1") {
      setPhoneError("เซสชันหมดอายุหรือมีการเข้าสู่ระบบจากที่อื่น กรุณาเข้าสู่ระบบใหม่");
    }
  }, []);

  useEffect(() => {
    if (step === "success" && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const dest = params.get("from") ?? "/dashboard";
      setTimeout(() => { window.location.href = dest; }, 1500);
    }
  }, [step]);

  function validatePhone(): boolean {
    const digits = phoneDisplay.replace(/\D/g, "");
    if (!digits) { setPhoneError("กรุณากรอกเบอร์โทรศัพท์"); return false; }
    if (!/^0[6-9]\d{8}$/.test(digits)) { setPhoneError("เบอร์ไม่ถูกต้อง (06–09, ครบ 10 หลัก)"); return false; }
    return true;
  }

  function switchMode(m: LoginMode) { setMode(m); setPhoneError(""); setStep("input"); }

  const phoneComplete = phoneDisplay.replace(/\D/g, "").length === 10;
  const phoneGreenCheck = phoneComplete ? (
    <div className="w-5 h-5 rounded-full bg-ap-green flex items-center justify-center animate-pop-in">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  ) : null;

  // ── Success ──────────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="text-center py-4 animate-fade-up">
        <div className="w-20 h-20 rounded-full bg-ap-green/10 flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-[22px] font-bold text-ap-primary">เข้าสู่ระบบสำเร็จ!</h2>
        <p className="text-[14px] text-ap-secondary mt-1.5">
          ยินดีต้อนรับกลับมา{" "}
          <span className="font-semibold text-ap-primary">
            {maskPhone(mode === "otp" ? otpPhone : phoneDisplay)}
          </span>
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 text-[13px] text-ap-tertiary">
          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          กำลังพาไปยังหน้าหลัก…
        </div>
        <a href="/dashboard" className="mt-2 block text-[13px] text-ap-blue font-medium hover:opacity-70">ไปเลย →</a>
      </div>
    );
  }

  // ── OTP step 2: verify ───────────────────────────────────────────────────────
  if (step === "otp") {
    const otpFull = otpDigits.join("");
    return (
      <div ref={cardRef} className="animate-fade-up">
        <button onClick={() => setStep("input")} className="flex items-center gap-1.5 text-[13px] text-ap-blue font-medium mb-6 hover:opacity-70">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
          กลับ
        </button>
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-ap-blue/10 flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-[20px] font-bold text-ap-primary">ยืนยัน OTP</h2>
          <p className="text-[14px] text-ap-secondary mt-1">
            ส่งรหัส 6 หลักไปยัง <span className="font-semibold text-ap-primary">{maskPhone(otpPhone)}</span>
          </p>
          <p className="text-[12px] text-ap-tertiary mt-0.5">
            (Demo: <span className="font-mono font-bold text-ap-primary">123456</span>)
          </p>
        </div>
        {otpError && <div className="mb-5"><ErrorBanner msg={otpError} /></div>}
        <OtpInputRow value={otpDigits} onChange={setOtpDigits} error={!!otpError} />
        <div className="text-center mt-4 mb-6">
          {expired ? (
            <form action={reqAction}>
              <input type="hidden" name="phone" value={otpPhone} />
              <button type="submit" className="text-[13px] text-ap-blue font-semibold hover:opacity-70">ส่ง OTP อีกครั้ง</button>
            </form>
          ) : (
            <p className="text-[13px] text-ap-tertiary">
              ส่งรหัสใหม่ได้ใน{" "}
              <span className="font-semibold text-ap-primary tabular-nums">
                {String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}
              </span>
            </p>
          )}
        </div>
        <form action={verifyAction}>
          <input type="hidden" name="otp" value={otpFull} />
          <input type="hidden" name="phone" value={otpPhone} />
          <SubmitButton disabled={otpFull.length < 6}>ยืนยัน OTP</SubmitButton>
        </form>
      </div>
    );
  }

  // ── Input screen ─────────────────────────────────────────────────────────────
  return (
    <div ref={cardRef}>

      {/* Tab switcher */}
      <div className="flex bg-ap-bg rounded-2xl p-1 mb-7 gap-1">
        {([ "password","otp"] as LoginMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={[
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200",
              mode === m ? "bg-white text-ap-primary shadow-card" : "text-ap-tertiary hover:text-ap-secondary",
            ].join(" ")}
          >
            <span>{m === "otp" ? "💬" : "🔑"}</span>
            <span className="hidden sm:inline">{m === "otp" ? "เบอร์โทร + OTP" : "เบอร์โทร + รหัสผ่าน"}</span>
            <span className="sm:hidden">{m === "otp" ? "OTP" : "รหัสผ่าน"}</span>
          </button>
        ))}
      </div>

      {/* OTP form */}
      {mode === "otp" && (
        <form action={reqAction} className="flex flex-col gap-4"
          onSubmit={(e) => { if (!validatePhone()) e.preventDefault(); }}>
          <Input
            label="เบอร์โทรศัพท์"
            name="phone" type="tel" inputMode="tel"
            placeholder="0XX-XXX-XXXX" autoComplete="tel"
            value={phoneDisplay}
            onChange={(e) => { setPhoneDisplay(formatPhone(e.target.value.replace(/\D/g, "").slice(0, 10))); setPhoneError(""); }}
            onBlur={validatePhone}
            error={phoneError || reqState.error}
            leftEl={<PhoneIcon />} rightEl={phoneGreenCheck}
            hint={!phoneError && !reqState.error ? "ระบบจะส่ง OTP ไปยังเบอร์นี้" : undefined}
          />
          <SubmitButton>ขอรับรหัส OTP →</SubmitButton>
        </form>
      )}

      {/* Password form */}
      {mode === "password" && (
        <form action={pwAction} className="flex flex-col gap-4"
          onSubmit={(e) => { if (!validatePhone()) e.preventDefault(); }}>
          <Input
            label="เบอร์โทรศัพท์"
            name="phone" type="tel" inputMode="tel"
            placeholder="0XX-XXX-XXXX" autoComplete="tel"
            value={phoneDisplay}
            onChange={(e) => { setPhoneDisplay(formatPhone(e.target.value.replace(/\D/g, "").slice(0, 10))); setPhoneError(""); }}
            onBlur={validatePhone}
            error={phoneError || pwState.fieldErrors?.phone}
            leftEl={<PhoneIcon />} rightEl={phoneGreenCheck}
          />
          <Input
            label="รหัสผ่าน"
            name="password" type={showPw ? "text" : "password"}
            placeholder="รหัสผ่านของคุณ" autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={pwState.fieldErrors?.password}
            leftEl={<LockIcon />}
            rightEl={
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="text-ap-tertiary hover:text-ap-secondary transition-colors" tabIndex={-1}>
                <EyeIcon open={showPw} />
              </button>
            }
            hint={!pwState.fieldErrors?.password ? "Demo: demo1234" : undefined}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <button type="button" onClick={() => setRemember(!remember)}
                className={["w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
                  remember ? "bg-ap-blue border-ap-blue" : "bg-white border-ap-border group-hover:border-ap-blue/40"].join(" ")}>
                {remember && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
              <span className="text-[13px] text-ap-secondary select-none">จดจำฉัน</span>
            </label>
            <button type="button" className="text-[13px] text-ap-blue font-medium hover:opacity-70">ลืมรหัสผ่าน?</button>
          </div>
          {pwState.error && <ErrorBanner msg={pwState.error} />}
          <SubmitButton>เข้าสู่ระบบ</SubmitButton>
        </form>
      )}

      <p className="text-center text-[13px] text-ap-secondary mt-6">
        ยังไม่มีบัญชี?{" "}
        <a href="/register" className="text-ap-blue font-semibold hover:opacity-70">สมัครสมาชิกฟรี</a>
      </p>
    </div>
  );
}
