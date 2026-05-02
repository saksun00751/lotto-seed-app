"use client";

import { useState, useRef, useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginWithPasswordAction } from "@/lib/actions";
import { getRegisterPagePath } from "@/lib/config/register";
import Input from "@/components/ui/Input";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLang } from "@/lib/i18n/context";

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
          {children}
        </>
      ) : children}
    </button>
  );
}

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
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

export default function LoginForm() {
  const t = useTranslation("login");
  const { lang } = useLang();
  const registerPath = getRegisterPagePath(lang);

  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [success, setSuccess] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const [pwState, pwAction] = useActionState(loginWithPasswordAction, {});

  function shake() {
    cardRef.current?.classList.add("animate-shake");
    setTimeout(() => cardRef.current?.classList.remove("animate-shake"), 450);
  }

  useEffect(() => {
    if (pwState.success) setSuccess(true);
    if (pwState.error || pwState.fieldErrors) shake();
  }, [pwState]);

  useEffect(() => {
    if (success && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const dest = params.get("from") ?? `/${lang}/dashboard`;
      setTimeout(() => { window.location.href = dest; }, 1500);
    }
  }, [success, lang]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired") === "1") setUsernameError(t.errSession);
  }, [t.errSession]);

  function validateUsername(): boolean {
    const value = username.trim();
    if (!value) {
      setUsernameError((t as Record<string, string>).errUsername ?? t.errPhone);
      return false;
    }
    return true;
  }

  const usernameComplete = username.trim().length > 0;
  const usernameGreenCheck = usernameComplete ? (
    <div className="w-5 h-5 rounded-full bg-ap-green flex items-center justify-center animate-pop-in">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  ) : null;

  // ── Success ──────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="text-center py-4 animate-fade-up">
        <div className="w-20 h-20 rounded-full bg-ap-green/10 flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-[22px] font-bold text-ap-primary">{t.successTitle}</h2>
        <p className="text-[14px] text-ap-secondary mt-1.5">
          {t.successBack}{" "}
          <span className="font-semibold text-ap-primary">{username || "-"}</span>
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 text-[13px] text-ap-tertiary">
          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {t.successRedirect}
        </div>
        <a href={`/${lang}/dashboard`} className="mt-2 block text-[13px] text-ap-blue font-medium hover:opacity-70">{t.goNow}</a>
      </div>
    );
  }

  // ── Password form ─────────────────────────────────────────────────────────────
  return (
    <div ref={cardRef}>
      <form action={pwAction} className="flex flex-col gap-4"
        onSubmit={(e) => { if (!validateUsername()) e.preventDefault(); }}>
        <input type="hidden" name="lang" value={lang} />
        <Input
          label={(t as Record<string, string>).username ?? t.phone}
          name="user_name" type="text" inputMode="text"
          placeholder={(t as Record<string, string>).usernamePlaceholder ?? "username"}
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => { setUsername(e.target.value); setUsernameError(""); }}
          error={usernameError || pwState.fieldErrors?.user_name}
          leftEl={<UserIcon />} rightEl={usernameGreenCheck}
        />
        <Input
          label={t.password}
          name="password" type={showPw ? "text" : "password"}
          placeholder="••••••••" autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={pwState.fieldErrors?.password}
          leftEl={<LockIcon />}
          rightEl={
            <button type="button" onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              className="text-ap-tertiary hover:text-ap-secondary transition-colors">
              <EyeIcon open={showPw} />
            </button>
          }
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <button type="button" onClick={() => setRemember(!remember)}
              className={["w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
                remember ? "bg-ap-blue border-ap-blue" : "bg-white border-ap-border group-hover:border-ap-blue/40"].join(" ")}>
              {remember && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
            <span className="text-[13px] text-ap-secondary select-none">{t.remember}</span>
          </label>
          <a href={`/${lang}/contact-public`} className="text-[13px] text-ap-blue font-medium hover:opacity-70">{t.forgot}</a>
        </div>
        {pwState.error && <ErrorBanner msg={pwState.error} />}
        <SubmitButton>{t.submitLogin}</SubmitButton>
      </form>

      <p className="text-center text-[13px] text-ap-secondary mt-6">
        {t.noAccount}{" "}
        <a href={registerPath} className="text-ap-blue font-semibold hover:opacity-70">{t.register}</a>
      </p>
    </div>
  );
}
