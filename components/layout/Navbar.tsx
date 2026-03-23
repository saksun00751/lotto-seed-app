"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { logoutAction } from "@/lib/actions";

interface NavbarProps {
  balance?: number;
  diamond?: number;
  userName?: string;
  userPhone?: string;
  ticker?: string;
}

export default function Navbar({
  balance = 0,
  diamond = 0,
  userName = "สมาชิก",
  userPhone = "",
  ticker = "",
}: NavbarProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setProfileOpen(false);
    }
    if (profileOpen) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [profileOpen]);

  const navLinks = [
    { href: "/dashboard", label: "หน้าแรก", icon: "🏠" },
    { href: "/deposit",   label: "ฝากเงิน",  icon: "💰" },
    { href: "/bet",       label: "เล่น",   icon: "🎯" },
    { href: "/withdraw",  label: "ถอนเงิน",  icon: "💸" },
    { href: "/contact",   label: "ติดต่อ",    icon: "💬" },
  ];

  const desktopNavLinks = [
    { href: "/dashboard", label: "หน้าแรก", icon: "🏠" },
    { href: "/deposit",   label: "ฝากเงิน",  icon: "💰" },
    { href: "/bet",       label: "เล่น",   icon: "🎯" },
    { href: "/withdraw",  label: "ถอนเงิน",  icon: "💸" },
    { href: "/history",   label: "โพยหวย",   icon: "📋" },
    { href: "/contact",   label: "ติดต่อ",    icon: "💬" },
  ];

  const profileMenuItems = [
    { icon: "👤", label: "ข้อมูลสมาชิก",   href: "/profile" },
    { icon: "💰", label: "แนะนำเพื่อน",    href: "/referral" },
    { icon: "📋", label: "โพยหวย",          href: "/history" },
    { icon: "🎁", label: "โปรโมชั่น",       href: "/promotion" },
    { icon: "💳", label: "ประวัติ",  href: "/transactions" },
    { icon: "🔐", label: "เปลี่ยนรหัสผ่าน", href: "/change-password" },
    { icon: "🎡", label: "หมุนวงล้อ",       href: "/spin" },
    { icon: "🎟️", label: "คูปอง",           href: "/coupon" },
  ];

  const initials = userName ? userName.slice(0, 1).toUpperCase() : "U";

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-ap-border">
        <div className="max-w-5xl mx-auto px-3 sm:px-5 h-[84px] sm:h-[88px] flex items-center justify-between gap-2">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center flex-shrink-0 group">
            <Image
              src="/logo.png"
              alt="1168Lot"
              width={200}
              height={200}
              className="h-20 w-auto object-contain group-hover:opacity-90 transition-opacity"
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

            {/* Diamond — desktop */}
            <Link href="/spin"
              className="hidden sm:flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 hover:border-ap-blue/50 transition-colors">
              <span className="text-[13px]">💎</span>
              <span className="text-[13px] font-semibold text-ap-blue tabular-nums">{diamond}</span>
            </Link>

            {/* Balance */}
            <Link href="/deposit"
              className="flex items-center gap-1.5 bg-ap-bg border border-ap-border rounded-full px-2.5 sm:px-3 py-1.5 hover:border-ap-blue/30 transition-colors">
              <span className="text-[13px]">💰</span>
              <span className="text-[12px] sm:text-[13px] font-semibold text-ap-primary tabular-nums">
                ฿{balance.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="hidden sm:inline text-[11px] text-ap-blue font-medium">+ เติม</span>
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
                <div className="absolute right-0 top-[calc(100%+8px)] w-[240px] bg-white rounded-2xl shadow-card-xl border border-ap-border overflow-hidden animate-pop-in z-50">
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
                        <span className="text-[11px] text-ap-tertiary">ยอดเงิน</span>
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
                        {item.href === "/referral" ? (
                          <span className="ml-auto text-[10px] font-bold text-white bg-ap-red rounded-full px-1.5 py-0.5">ใหม่</span>
                        ) : (
                          <svg className="ml-auto w-3.5 h-3.5 text-ap-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        )}
                      </Link>
                    ))}
                    <div className="border-t border-ap-border mt-1 pt-1">
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors text-ap-red hover:bg-ap-red/5"
                        >
                          <span className="text-[16px] w-5 text-center flex-shrink-0">🚪</span>
                          ออกจากระบบ
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

      {/* Announcement ticker */}
      {ticker && (
        <div className="bg-gray-100 sticky top-[84px] sm:top-[88px] z-40 overflow-hidden border-b border-ap-border animate-fade-in-slow">
          <div className="flex items-center">
            <span className="flex-shrink-0 bg-ap-blue text-white text-[13px] font-bold px-4 py-2">
              📢 ประกาศ
            </span>
            <div className="overflow-hidden flex-1">
              <p className="text-ap-primary text-[13px] font-medium whitespace-nowrap animate-marquee [animation-fill-mode:backwards] px-4 py-2">
                {ticker}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom tabs */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-ap-border z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${navLinks.length}, 1fr)` }}>
          {navLinks.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link key={l.href} href={l.href}
                className={[
                  "flex flex-col items-center justify-center gap-0.5 py-1.5 min-w-0 transition-colors active:scale-95",
                  active ? "text-ap-blue" : "text-ap-tertiary",
                ].join(" ")}>
                <span className="text-[22px] leading-none">{l.icon}</span>
                <span className={["text-[10px] truncate w-full text-center px-0.5 leading-tight", active ? "font-bold" : "font-medium"].join(" ")}>
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
