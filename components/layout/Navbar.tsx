"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { logoutAction } from "@/lib/actions";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLang, type LangCode } from "@/lib/i18n/context";
import { useUser } from "@/components/providers/UserProvider";
import type { NavbarItem } from "@/lib/api/navbar";

const LANGS: { code: LangCode; flag: string; flagIcon: string; label: string }[] = [
  { code: "th", flag: "🇹🇭", flagIcon: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f9-1f1ed.svg", label: "ไทย" },
  { code: "en", flag: "🇬🇧", flagIcon: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1ec-1f1e7.svg", label: "EN" },
  { code: "kh", flag: "🇰🇭", flagIcon: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f0-1f1ed.svg", label: "ខ្មែរ" },
  { code: "la", flag: "🇱🇦", flagIcon: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f1-1f1e6.svg", label: "ລາວ" },
];

interface NavbarProps {
  logoUrl:         string;
  balance:         number;
  diamond:         number;
  userName:        string;
  userPhone:       string;
  mobileNavItems?: NavbarItem[] | null;
}

type IconName =
  | "home"
  | "withdraw"
  | "play"
  | "history"
  | "contact"
  | "profile"
  | "referral"
  | "promotion"
  | "finance"
  | "check-result"
  | "password"
  | "spin"
  | "coupon"
  | "bonus"
  | "reward"
  | "logout"
  | "deposit"
  | "diamond";

function iconForPath(path: string): IconName {
  if (path.includes("/withdraw")) return "withdraw";
  if (path.includes("/bet")) return "play";
  if (path.includes("/history")) return "history";
  if (path.includes("/contact")) return "contact";
  if (path.includes("/profile")) return "profile";
  if (path.includes("/referral")) return "referral";
  if (path.includes("/promotion")) return "promotion";
  if (path.includes("/transactions")) return "finance";
  if (path.includes("/check-result")) return "check-result";
  if (path.includes("/change-password")) return "password";
  if (path.includes("/spin")) return "spin";
  if (path.includes("/coupon")) return "coupon";
  if (path.includes("/bonus")) return "bonus";
  if (path.includes("/reward")) return "reward";
  if (path.includes("/deposit")) return "deposit";
  return "home";
}

function normalizeIcon(raw: string | null | undefined, path?: string): IconName {
  const value = (raw ?? "").toLowerCase();
  if (value.includes("home") || value.includes("house")) return "home";
  if (value.includes("withdraw")) return "withdraw";
  if (value.includes("bet") || value.includes("target") || value.includes("play")) return "play";
  if (value.includes("history") || value.includes("list")) return "history";
  if (value.includes("contact") || value.includes("chat")) return "contact";
  if (value.includes("profile") || value.includes("user")) return "profile";
  if (value.includes("refer")) return "referral";
  if (value.includes("promo") || value.includes("gift")) return "promotion";
  if (value.includes("wallet") || value.includes("card") || value.includes("finance")) return "finance";
  if (value.includes("result") || value.includes("trophy")) return "check-result";
  if (value.includes("password") || value.includes("lock")) return "password";
  if (value.includes("spin") || value.includes("wheel")) return "spin";
  if (value.includes("coupon") || value.includes("ticket")) return "coupon";
  if (value.includes("reward") || value.includes("redeem")) return "reward";
  if (value.includes("bonus") || value.includes("trophy")) return "bonus";
  return iconForPath(path ?? "");
}

function AppIcon({ name, className }: { name: IconName; className?: string }) {
  const cls = className ?? "text-[14px] leading-none";
  const map: Record<IconName, string> = {
    home: "🏠",
    withdraw: "🍀",
    play: "🎯",
    history: "📋",
    contact: "💬",
    profile: "👤",
    referral: "👥",
    promotion: "🎁",
    finance: "💳",
    "check-result": "🏆",
    password: "🔐",
    spin: "🎡",
    coupon: "🎟️",
    bonus: "🏆",
    reward: "🎁",
    logout: "🚪",
    deposit: "💰",
    diamond: "💎",
  };
  return (
    <span aria-hidden className={`emoji-font ${cls}`}>
      {map[name]}
    </span>
  );
}

export default function Navbar({ logoUrl, balance, diamond, userName, userPhone, mobileNavItems }: NavbarProps) {
  const pathname = usePathname();
  const user = useUser();
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

  const fallbackNavLinks: { href: string; label: string; icon: IconName; rawIcon?: string; isCta: boolean }[] = [
    { href: `/${lang}/dashboard`, label: t.home,     icon: "home",     isCta: false },
    { href: `/${lang}/withdraw`,  label: t.withdraw, icon: "withdraw", isCta: false },
    { href: `/${lang}/bet`,       label: t.play,     icon: "play",     isCta: true  },
    { href: `/${lang}/history`,   label: t.history,  icon: "history",  isCta: false },
    { href: `/${lang}/contact`,   label: t.contact,  icon: "contact",  isCta: false },
  ];

  const navLinks: { href: string; label: string; icon: IconName; rawIcon?: string; isCta: boolean }[] =
    mobileNavItems && mobileNavItems.length > 0
      ? mobileNavItems.map((item) => ({
          href:    `/${lang}${item.action_value.startsWith("/") ? item.action_value : `/${item.action_value}`}`,
          label:   item.label_i18n?.[lang] ?? item.label,
          icon:    normalizeIcon(item.icon, item.action_value),
          rawIcon: item.icon,
          isCta:   item.item_type === "center_cta",
        }))
      : fallbackNavLinks;

  const desktopNavLinks = [
    { href: `/${lang}/dashboard`, label: t.home,    icon: "home" as IconName },
    { href: `/${lang}/history`,   label: t.history, icon: "history" as IconName },
    { href: `/${lang}/bet`,       label: t.play,    icon: "play" as IconName },
    { href: `/${lang}/withdraw`,  label: t.withdraw, icon: "withdraw" as IconName },
    { href: `/${lang}/check-result`, label: t.checkResult, icon: "check-result" as IconName },
    { href: `/${lang}/contact`,   label: t.contact,  icon: "contact" as IconName },
  ];

  const profileMenuItems = [
    { icon: "profile" as IconName, label: t.profile,        href: `/${lang}/profile` },
    { icon: "referral" as IconName, label: t.referral,       href: `/${lang}/referral` },
    { icon: "history" as IconName, label: t.history,        href: `/${lang}/history` },
    { icon: "promotion" as IconName, label: t.promotion,      href: `/${lang}/promotion` },
    { icon: "finance" as IconName, label: t.finance,        href: `/${lang}/transactions` },
    { icon: "check-result" as IconName, label: t.checkResult,    href: `/${lang}/check-result` },
    { icon: "password" as IconName, label: t.changePassword, href: `/${lang}/change-password` },
    { icon: "spin" as IconName, label: t.spin,           href: `/${lang}/spin` },
    { icon: "coupon" as IconName, label: t.coupon,         href: `/${lang}/coupon` },
    { icon: "bonus" as IconName,  label: t.bonus,          href: `/${lang}/bonus` },
    { icon: "reward" as IconName, label: t.reward,         href: `/${lang}/reward` },
  ];

  const liveBalance = user?.balance ?? balance;
  const liveDiamond = user?.diamond ?? diamond;
  const liveUserName = user?.displayName ?? userName;
  const liveUserPhone = user?.phone ?? userPhone;
  const initials = liveUserName ? liveUserName.slice(0, 1).toUpperCase() : "U";

  return (
    <>
      <nav className="sticky top-0 z-50 bg-navbar-bg backdrop-blur-xl border-b border-ap-border">
        <div className="max-w-5xl mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-2">

          {/* Logo */}
          <Link href={`/${lang}/dashboard`} className="flex items-center flex-shrink-0 group">
            <Image
              src={logoUrl}
              alt="logo"
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
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium transition-all whitespace-nowrap",
                    active ? "bg-ap-blue/10 text-ap-blue" : "text-ap-secondary hover:bg-ap-bg hover:text-ap-primary",
                  ].join(" ")}>
                  <AppIcon name={l.icon} className="text-[14px] leading-none" />
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
              <AppIcon name="deposit" className="text-[14px] leading-none" />
                <span className="text-[13px] sm:text-[13px] font-bold text-ap-primary tabular-nums">
                ฿{liveBalance.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
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
                <div className="absolute right-0 top-[calc(100%+8px)] w-[248px] bg-white rounded-2xl shadow-[0_16px_36px_rgba(15,23,42,0.18)] border border-slate-200 overflow-x-hidden overflow-y-auto max-h-[calc(100dvh-88px)] sm:max-h-[80vh] overscroll-contain animate-pop-in z-50">
                  {/* Language switcher */}
                  <div className="px-4 pt-2.5 pb-2 flex items-center justify-between">
                    <span className="text-[13px] font-bold text-slate-500">{t.language}</span>
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); setLangModalOpen(true); }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[13px] font-bold text-slate-700 hover:border-ap-blue/35 transition-all"
                    >
                      <img
                        src={LANGS.find((l) => l.code === lang)?.flagIcon}
                        alt={LANGS.find((l) => l.code === lang)?.flag ?? lang}
                        className="w-4 h-4 rounded-sm object-cover"
                      />
                      <span>{LANGS.find((l) => l.code === lang)?.label}</span>
                      <svg className="w-3 h-3 text-ap-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 9l-7 7-7-7"/></svg>
                    </button>
                  </div>

                  {/* Header */}
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-ap-blue flex items-center justify-center text-white font-bold text-[14px] flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-ap-primary truncate">{liveUserName}</p>
                        {liveUserPhone && <p className="text-[13px] font-semibold text-ap-tertiary">{liveUserPhone}</p>}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      <div className="flex flex-col items-center rounded-xl px-2.5 py-2 border border-slate-200 bg-slate-50/70">
                        <span className="text-[12px] font-bold text-slate-500">{t.balance}</span>
                        <span className="text-[17px] leading-none mt-0.5 font-extrabold text-ap-blue tabular-nums tracking-tight">
                          ฿{liveBalance.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex flex-col items-center rounded-xl px-2.5 py-2 border border-slate-200 bg-slate-50/70">
                        <span className="text-[12px] font-bold text-slate-500">Diamond</span>
                        <span className="text-[17px] leading-none mt-0.5 font-extrabold text-cyan-700 tabular-nums inline-flex items-center justify-center gap-1.5 tracking-tight">
                          <AppIcon name="diamond" className="text-[15px] leading-none" />
                          <span className="leading-none">{liveDiamond.toLocaleString("th-TH")}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mx-4 border-t border-slate-200/80" />

                  {/* Menu */}
                  <div className="py-1.5">
                    {profileMenuItems.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setProfileOpen(false)}
                        className={[
                          "group flex items-center gap-2.5 px-3 py-2.5 text-[14px] rounded-xl mx-1.5 border border-transparent transition-all duration-200 ease-out",
                          active
                            ? "bg-ap-blue/10 text-ap-blue font-bold"
                            : "text-ap-primary font-semibold hover:bg-gradient-to-r hover:from-[#ffffff] hover:to-[#f3f8ff] hover:border-[#d9e8ff] hover:shadow-[0_6px_14px_rgba(37,99,235,0.10)] hover:-translate-y-[1px]",
                        ].join(" ")}
                      >
                        <span className={[
                          "w-6.5 h-6.5 rounded-lg flex items-center justify-center border transition-all duration-200",
                          active
                            ? "bg-white border-ap-blue/25 text-ap-blue"
                            : "bg-slate-50 border-slate-200 text-slate-600 group-hover:border-[#bfdbfe] group-hover:bg-[#eff6ff] group-hover:text-ap-blue group-hover:scale-[1.04]",
                        ].join(" ")}>
                          <AppIcon name={item.icon} className="w-4 h-4" />
                        </span>
                        {item.label}
                        <svg className="ml-auto w-3.5 h-3.5 text-slate-400 transition-all duration-200 group-hover:text-ap-blue group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </Link>
                      );
                    })}
                    <div className="border-t border-slate-200/80 pt-1.5 mt-1">
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="group w-full flex items-center gap-2.5 px-3 py-2.5 text-[14px] font-bold transition-all duration-200 ease-out text-ap-red hover:bg-gradient-to-r hover:from-rose-50 hover:to-white hover:border-rose-200/80 border border-transparent hover:shadow-[0_6px_14px_rgba(244,63,94,0.10)] rounded-xl mx-1.5"
                        >
                          <span className="w-6.5 h-6.5 rounded-lg flex items-center justify-center border bg-rose-50 border-rose-200 text-rose-500 transition-transform duration-200 group-hover:scale-[1.04]">
                            <AppIcon name="logout" className="w-4 h-4" />
                          </span>
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
              <p className="text-[15px] font-bold text-ap-primary">{t.language}</p>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => { setLang(l.code); setLangModalOpen(false); }}
                  className={[
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-bold transition-all w-full text-left",
                    lang === l.code
                      ? "bg-ap-blue/10 text-ap-blue border border-ap-blue/30"
                      : "text-ap-primary hover:bg-ap-bg border border-transparent",
                  ].join(" ")}
                >
                  <img src={l.flagIcon} alt={l.flag} className="w-5 h-5 rounded-sm object-cover" />
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
        className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-ap-border z-50 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${navLinks.length}, 1fr)` }}>
          {navLinks.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            const isPlay = l.isCta;
            const ctaLabel = l.label.replace(/\s*→\s*$/g, "").replace(/\s+/g, " ").trim();
            return (
              <Link key={l.href} href={l.href}
                className={[
                  "min-w-0 transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5 py-1.5",
                  active ? "text-ap-blue" : "text-ap-tertiary",
                ].join(" ")}>
                {l.rawIcon ? (
                  <span aria-hidden className="emoji-font shrink-0 leading-none text-[22px]">
                    {l.rawIcon}
                  </span>
                ) : (
                  <AppIcon name={l.icon} className="shrink-0 leading-none w-[22px] h-[22px]" />
                )}
                <span className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[12px] w-full text-center px-0.5 leading-none font-bold">
                  {isPlay ? ctaLabel : l.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
