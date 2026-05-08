"use client";

import Image from "next/image";
import { LangProvider } from "@/lib/i18n/context";
import { useTranslation } from "@/lib/i18n/useTranslation";
import RegisterForm, { BankOption } from "@/components/auth/RegisterForm";
import LanguageSwitcher from "@/components/auth/LanguageSwitcher";

interface Props {
  initialLang: string;
  defaultRef: string;
  banks:      BankOption[];
  logoUrl:    string;
}

type RegisterContentProps = Omit<Props, "initialLang">;

function RegisterContent({ defaultRef, banks, logoUrl }: RegisterContentProps) {
  const t = useTranslation("register");

  return (
    <div className="relative w-full max-w-[420px] animate-fade-up">

      {/* Logo + heading */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image src={logoUrl} alt="Logo" width={200} height={200} className="h-40 w-auto object-contain" priority />
        </div>

        <div className="mt-4">
          <LanguageSwitcher />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mt-4 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">1</span>
            </div>
            <span className="text-[12px] text-brand-primary font-medium">{t.stepFill}</span>
          </div>
          <div className="w-8 h-px bg-border-default" />
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-border-default flex items-center justify-center">
              <span className="text-text-muted text-[11px] font-bold">2</span>
            </div>
            <span className="text-[12px] text-text-muted">{t.stepDone}</span>
          </div>
        </div>

        <h1 className="text-[28px] font-bold text-text-strong tracking-tight leading-none">
          {t.heading}
        </h1>
        {/* <p className="text-[15px] text-text-default mt-2">
          {t.subtitle}
        </p> */}
      </div>

      {/* Card */}
      <div className="bg-white rounded-[28px] shadow-card-xl border border-border-default p-8">
        <RegisterForm defaultRef={defaultRef} banks={banks} />
      </div>

      {/* Footer */}
      <p className="text-center text-[11.5px] text-text-muted mt-5 leading-relaxed">
        {t.footer}
        <br />
        <span className="inline-flex items-center gap-1 mt-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          {t.footerSub}
        </span>
      </p>
    </div>
  );
}

export default function RegisterPageClient({ initialLang, defaultRef, banks, logoUrl }: Props) {
  return (
    <LangProvider initialLang={initialLang}>
      <RegisterContent defaultRef={defaultRef} banks={banks} logoUrl={logoUrl} />
    </LangProvider>
  );
}
