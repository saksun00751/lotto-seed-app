"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { logoutAction } from "@/lib/actions";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLang, type LangCode } from "@/lib/i18n/context";

const LANGS: { code: LangCode; flag: string; label: string }[] = [
  { code: "th", flag: "🇹🇭", label: "ไทย" },
  { code: "en", flag: "🇬🇧", label: "EN" },
  { code: "kh", flag: "🇰🇭", label: "ខ្មែរ" },
  { code: "la", flag: "🇱🇦", label: "ລາວ" },
];

interface NavbarProps {
  logoUrl:   string;
  balance:   number;
  diamond:   number;
  userName:  string;
  userPhone: string;
}

export default function Navbar({ logoUrl, balance, diamond, userName, userPhone }: NavbarProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const t = useTranslation("navbar");
  const { lang, setLang } = useLang();

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setProfileOpen(false);
    }
    if (profileOpen) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [profileOpen]);

  const navLinks = [
    { href: `/${lang}/dashboard`, label: t.home,    icon: "🏠" },
    { href: `/${lang}/withdraw`,  label: t.withdraw, icon: "💸" },
    { href: `/${lang}/bet`,       label: t.play,    icon: "🎯" },
    { href: `/${lang}/history`,   label: t.history, icon: "📋" },
    { href: `/${lang}/contact`,   label: t.contact,  icon: "💬" },
  ];

  const desktopNavLinks = [
    { href: `/${lang}/dashboard`, label: t.home,    icon: "🏠" },
    { href: `/${lang}/history`,   label: t.history, icon: "📋" },
    { href: `/${lang}/bet`,       label: t.play,    icon: "🎯" },
    { href: `/${lang}/withdraw`,  label: t.withdraw, icon: "💸" },
    { href: `/${lang}/check-result`, label: t.checkResult, icon: "🏆" },
    { href: `/${lang}/contact`,   label: t.contact,  icon: "💬" },
  ];

  const profileMenuItems = [
    { icon: "👤", label: t.profile,        href: `/${lang}/profile` },
    { icon: "💰", label: t.referral,       href: `/${lang}/referral` },
    { icon: "📋", label: t.history,        href: `/${lang}/history` },
    { icon: "🎁", label: t.promotion,      href: `/${lang}/promotion` },
    { icon: "💳", label: t.finance,        href: `/${lang}/transactions` },
    { icon: "🏆", label: t.checkResult,    href: `/${lang}/check-result` },
    { icon: "🔐", label: t.changePassword, href: `/${lang}/change-password` },
    { icon: "🎡", label: t.spin,           href: `/${lang}/spin` },
    { icon: "🎟️", label: t.coupon,         href: `/${lang}/coupon` },
  ];

  const initials = userName ? userName.slice(0, 1).toUpperCase() : "U";

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-ap-border">
        <div className="max-w-5xl mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-2">

          {/* Logo */}
          <Link href={`/${lang}/dashboard`} className="flex items-center flex-shrink-0 group">
            <Image
              src={logoUrl}
              alt="1168Lot"
              width={200}
              height={200}
              className="h-24 w-auto object-contain group-hover:opacity-90 transition-opacity"
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-0.5">
            {desktopNavLinks.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link key={l.href} href={l.href}
                  className={[
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium transition-all",
                    active ? "bg-ap-blue/10 text-ap-blue" : "text-ap-secondary hover:bg-ap-bg hover:text-ap-primary",
                  ].join(" ")}>
                  <span className="text-[14px]">{l.icon}</span>
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Balance */}
            <Link href={`/${lang}/deposit`}
              className="flex items-center gap-1.5 bg-ap-bg border border-ap-border rounded-full px-2.5 sm:px-3 py-1.5 hover:border-ap-blue/30 transition-colors">
              <span className="text-[13px]">💰</span>
              <span className="text-[12px] sm:text-[13px] font-semibold text-ap-primary tabular-nums">
                ฿{balance.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className=" sm:inline text-[11px] text-ap-blue font-medium">+ เติม</span>
            </Link>

            {/* Avatar + dropdown */}
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className={[
                  "w-8 h-8 rounded-full bg-ap-blue flex items-center justify-center text-white text-[13px] font-bold shadow-sm transition-all",
                  profileOpen ? "ring-2 ring-ap-blue/30 shadow-md" : "hover:shadow-md",
                ].join(" ")}
              >
                {initials}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[240px] bg-white rounded-2xl shadow-card-xl border border-ap-border overflow-x-hidden overflow-y-auto max-h-[calc(100dvh-88px)] sm:max-h-[80vh] overscroll-contain animate-pop-in z-50">
                  {/* Language switcher */}
                  <div className="px-4 py-2 flex items-center justify-between border-b border-ap-border bg-ap-bg/60">
                    <span className="text-[12px] text-ap-secondary">{t.language}</span>
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); setLangModalOpen(true); }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-ap-border text-[12px] font-medium text-ap-primary hover:border-ap-blue/40 transition-all"
                    >
                      <span>{LANGS.find((l) => l.code === lang)?.flag}</span>
                      <span>{LANGS.find((l) => l.code === lang)?.label}</span>
                      <svg className="w-3 h-3 text-ap-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 9l-7 7-7-7"/></svg>
                    </button>
                  </div>

                  {/* Header */}
                  <div className="px-4 py-3.5 border-b border-ap-border bg-ap-bg/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-ap-blue flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-ap-primary truncate">{userName}</p>
                        {userPhone && <p className="text-[12px] text-ap-tertiary">{userPhone}</p>}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="flex flex-col items-center bg-white rounded-xl px-3 py-2 border border-ap-border">
                        <span className="text-[11px] text-ap-tertiary">{t.balance}</span>
                        <span className="text-[13px] font-bold text-ap-blue tabular-nums">
                          ฿{balance.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex flex-col items-center bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
                        <span className="text-[11px] text-ap-tertiary">Diamond</span>
                        <span className="text-[13px] font-bold text-ap-blue tabular-nums">💎 {diamond}</span>
                      </div>
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="py-1.5">
                    {profileMenuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors text-ap-primary hover:bg-ap-bg"
                      >
                        <span className="text-[16px] w-5 text-center flex-shrink-0">{item.icon}</span>
                        {item.label}
                        {item.href === `/${lang}/referral` ? (
                          <span className="ml-auto text-[10px] font-bold text-white bg-ap-red rounded-full px-1.5 py-0.5">ใหม่</span>
                        ) : (
                          <svg className="ml-auto w-3.5 h-3.5 text-ap-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        )}
                      </Link>
                    ))}
                    <div className="border-t border-ap-border pt-1">
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors text-ap-red hover:bg-ap-red/5"
                        >
                          <span className="text-[16px] w-5 text-center flex-shrink-0">🚪</span>
                          {t.logout}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Language Modal */}
      {langModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setLangModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-card-xl border border-ap-border w-[280px] overflow-hidden animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-ap-border">
              <p className="text-[14px] font-semibold text-ap-primary">{t.language}</p>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => { setLang(l.code); setLangModalOpen(false); }}
                  className={[
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all w-full text-left",
                    lang === l.code
                      ? "bg-ap-blue/10 text-ap-blue border border-ap-blue/30"
                      : "text-ap-primary hover:bg-ap-bg border border-transparent",
                  ].join(" ")}
                >
                  <span className="text-[20px]">{l.flag}</span>
                  <span>{l.label}</span>
                  {lang === l.code && (
                    <svg className="ml-auto w-4 h-4 text-ap-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom tabs */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-ap-border z-50"
      >
        <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${navLinks.length}, 1fr)` }}>
          {navLinks.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            const isPlay = l.href === `/${lang}/bet`;
            return (
              <Link key={l.href} href={l.href}
                className={[
                  "flex flex-col items-center justify-center gap-0.5 min-w-0 transition-all active:scale-95",
                  isPlay
                    ? [
                        "relative -mt-4 mb-1 mx-1 rounded-2xl py-2 shadow-lg border",
                        active
                          ? "bg-ap-blue text-white border-ap-blue"
                          : "bg-ap-blue text-white border-ap-blue/70 hover:bg-ap-blue-h",
                      ].join(" ")
                    : [
                        "py-1.5",
                        active ? "text-ap-blue" : "text-ap-tertiary",
                      ].join(" "),
                ].join(" ")}>
                <span className={["leading-none", isPlay ? "text-[24px]" : "text-[22px]"].join(" ")}>{l.icon}</span>
                <span className={[
                  "text-[10px] truncate w-full text-center px-0.5 leading-tight",
                  isPlay ? "font-bold" : active ? "font-bold" : "font-medium",
                ].join(" ")}>
                  {l.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
