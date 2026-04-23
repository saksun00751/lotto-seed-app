"use client";

import Link from "next/link";
import Image from "next/image";
import { LangProvider, useLang } from "@/lib/i18n/context";
import { useTranslation } from "@/lib/i18n/useTranslation";
import LoginForm from "@/components/auth/LoginForm";
import LanguageSwitcher from "@/components/auth/LanguageSwitcher";

function LoginContent({ logoUrl }: { logoUrl: string }) {
  const t = useTranslation("login");
  const { lang } = useLang();

  return (
    <div className="relative w-full max-w-[400px] animate-fade-up">

      {/* Logo + heading */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image src={logoUrl} alt="Logo" width={200} height={200} className="h-40 w-auto object-contain" priority />
        </div>
        <h1 className="text-[30px] font-bold text-ap-primary tracking-tight leading-none">
          {t.heading}
        </h1>
        {/* <p className="text-[15px] text-ap-secondary mt-2">
          {t.subtitle}
        </p> */}
        <div className="mt-4">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-[28px] shadow-card-xl border border-ap-border p-8">
        <LoginForm />
      </div>

      {/* Footer */}
      <p className="text-center text-[11.5px] text-ap-tertiary mt-5 leading-relaxed">
        {t.terms}{" "}
        <Link href={`/${lang}/contact-public`} className="underline hover:text-ap-secondary transition-colors">
          {t.termsLink}
        </Link>{" "}
        {t.and}{" "}
        <Link href={`/${lang}/contact-public`} className="underline hover:text-ap-secondary transition-colors">
          {t.privacyLink}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPageClient({ initialLang, expired, logoUrl }: { initialLang: string; expired?: boolean; logoUrl: string }) {
  return (
    <LangProvider initialLang={initialLang}>
      {expired && (
        <div className="w-full max-w-[400px] mb-4 bg-red-50 border border-red-200 text-red-700 text-[13.5px] font-medium rounded-2xl px-4 py-3 text-center">
          เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่
        </div>
      )}
      <LoginContent logoUrl={logoUrl} />
    </LangProvider>
  );
}
