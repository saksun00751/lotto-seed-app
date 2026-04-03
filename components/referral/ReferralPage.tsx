"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

// All dates are ISO strings and totalEarned is a plain number
// (serialized in the Server Component before passing as props)
interface ReferralItem {
  id?: string | number;
  totalEarned?: number;
  total_earned?: number;
  createdAt?: string;
  created_at?: string;
  phone?: string;
  display_name?: string;
  name?: string;
  referee?: {
    displayName?: string | null;
    display_name?: string | null;
    phone?: string;
    createdAt?: string;
    created_at?: string;
  };
}

interface Props {
  referralCode: string;
  referralLink: string;
  displayName: string;
  referredCount?: number;
  totalEarned?: number;
  promotionBonusIncome?: number;
  promotionBonusCount?: number;
  rule?: {
    promotion_id?: string;
    length_type?: string;
    bonus_percent?: number;
    bonus_price?: number;
    display_value?: string;
  } | null;
  referrals?: ReferralItem[];
}

function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.length >= 6 ? `${d.slice(0, 3)}-XXX-${d.slice(-2)}XX` : phone;
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={[
        "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all active:scale-95",
        copied
          ? "bg-ap-green text-white"
          : "bg-ap-blue text-white hover:bg-ap-blue-h",
      ].join(" ")}
    >
      {copied ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {copiedLabel}
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

const HOW_IT_WORKS = [
  { step: "1", icon: "🔗", title: "แชร์ลิงก์หรือรหัส", desc: "ส่งลิงก์หรือรหัสแนะนำให้เพื่อน" },
  { step: "2", icon: "📝", title: "เพื่อนสมัครสมาชิก", desc: "เพื่อนกรอกรหัสของคุณตอนสมัคร" },
  { step: "3", icon: "💰", title: "รับโบนัสทันที", desc: "รับเครดิตทุกครั้งที่เพื่อนแทง" },
];

export default function ReferralPage({
  referralCode,
  referralLink,
  displayName,
  referredCount = 0,
  totalEarned = 0,
  promotionBonusIncome = 0,
  promotionBonusCount = 0,
  rule = null,
  referrals = [],
}: Props) {
  const t = useTranslation("referral");
  const ruleValue = rule?.display_value
    ? `฿${Number(rule.display_value).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : (rule?.bonus_price ?? 0) > 0
      ? `฿${Number(rule?.bonus_price ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : null;

  return (
    <div className="max-w-5xl mx-auto px-5 pt-6 pb-24 sm:pb-8 space-y-5">

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-400 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-14 w-36 h-36 rounded-full bg-white/10" />
        <div className="relative">
          <div className="text-[44px] mb-3">🎁</div>
          <h1 className="text-[22px] font-bold tracking-tight leading-tight mb-1">{t.heroTitle}</h1>
          <p className="text-[13px] text-white/80">{t.heroDesc}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-ap-border shadow-card p-4 text-center">
          <div className="text-[32px] font-bold text-ap-blue tabular-nums">{referredCount}</div>
          <div className="text-[12px] text-ap-tertiary mt-0.5">{t.statFriends}</div>
        </div>
        <div className="bg-white rounded-2xl border border-ap-border shadow-card p-4 text-center">
          <div className="text-[32px] font-bold text-ap-green tabular-nums">฿{totalEarned.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[12px] text-ap-tertiary mt-0.5">{t.statIncome}</div>
        </div>
        <div className="bg-white rounded-2xl border border-ap-border shadow-card p-4 text-center">
          <div className="text-[32px] font-bold text-amber-600 tabular-nums">฿{promotionBonusIncome.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[12px] text-ap-tertiary mt-0.5">{t.statBonusIncome}</div>
        </div>
        <div className="bg-white rounded-2xl border border-ap-border shadow-card p-4 text-center">
          <div className="text-[32px] font-bold text-violet-600 tabular-nums">{promotionBonusCount.toLocaleString("th-TH")}</div>
          <div className="text-[12px] text-ap-tertiary mt-0.5">{t.statBonusCount}</div>
        </div>
      </div>

      {/* Rule */}
      {rule && (
        <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-ap-border">
            <p className="text-[12px] font-semibold text-ap-tertiary uppercase tracking-wide">{t.ruleTitle}</p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-ap-border bg-ap-bg/40 p-3">
              <p className="text-[11px] text-ap-tertiary">Promotion ID</p>
              <p className="text-[13px] font-bold text-ap-primary mt-0.5">{rule.promotion_id || "-"}</p>
            </div>
            <div className="rounded-xl border border-ap-border bg-ap-bg/40 p-3">
              <p className="text-[11px] text-ap-tertiary">Type</p>
              <p className="text-[13px] font-bold text-ap-primary mt-0.5">{rule.length_type || "-"}</p>
            </div>
            <div className="rounded-xl border border-ap-border bg-ap-bg/40 p-3">
              <p className="text-[11px] text-ap-tertiary">Bonus Percent</p>
              <p className="text-[13px] font-bold text-ap-primary mt-0.5">{Number(rule.bonus_percent ?? 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })}%</p>
            </div>
            <div className="rounded-xl border border-ap-border bg-ap-bg/40 p-3">
              <p className="text-[11px] text-ap-tertiary">Bonus Value</p>
              <p className="text-[13px] font-bold text-ap-primary mt-0.5">{ruleValue ?? "-"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Referral code + link */}
      <div className="bg-white rounded-2xl border border-ap-border shadow-card p-5 space-y-4">
        <p className="text-[12px] font-semibold text-ap-tertiary uppercase tracking-wide">{t.codeTitle}</p>

        {/* Code */}
        <div className="bg-ap-bg rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-ap-tertiary mb-1">{t.myCode}</div>
            <div className="text-[22px] font-bold text-ap-primary tracking-[0.15em] font-mono">{referralCode}</div>
          </div>
          <CopyButton text={referralCode} label={t.copyCode} copiedLabel={t.copied} />
        </div>

        {/* Link */}
        <div className="bg-ap-bg rounded-xl p-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-ap-tertiary mb-1">{t.myLink}</div>
            <div className="text-[14px] leading-6 text-ap-secondary break-all font-mono">{referralLink}</div>
          </div>
          <CopyButton text={referralLink} label={t.copyLink} copiedLabel={t.copied} />
        </div>

        {/* Share buttons */}
        <div className="flex gap-2">
          <a
            href={`https://line.me/share/ui?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`${displayName} ชวนคุณมาเล่นหวยกับ Lotto! ใช้รหัส ${referralCode} รับโบนัสทันที`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#06C755] text-white rounded-full py-2.5 text-[13px] font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="text-[16px]">💬</span>
            {t.shareLine}
          </a>
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "Lotto", text: `ใช้รหัส ${referralCode}`, url: referralLink });
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-ap-bg border border-ap-border text-ap-primary rounded-full py-2.5 text-[13px] font-semibold hover:bg-ap-border transition-colors"
          >
            <span className="text-[16px]">📤</span>
            {t.shareOther}
          </button>
        </div>
      </div>

      {/*
      <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-ap-border">
          <p className="text-[12px] font-semibold text-ap-tertiary uppercase tracking-wide">วิธีรับโบนัส</p>
        </div>
        <div className="divide-y divide-ap-border">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-[20px] flex-shrink-0">
                {step.icon}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-ap-primary">{step.title}</div>
                <div className="text-[12px] text-ap-tertiary mt-0.5">{step.desc}</div>
              </div>
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {step.step}
              </div>
            </div>
          ))}
        </div>
      </div>
      */}

      {/* Referred friends list */}
      <ReferralList referrals={referrals} referredCount={referredCount} totalEarned={totalEarned} t={t} />

    </div>
  );
}

// ─── Commission rate for a given rank ──────────────────────────────────────────
function commissionRate(rank: number): { rate: string; label: string; color: string } {
  if (rank <= 5)  return { rate: "0.5%", label: "Tier 1", color: "bg-blue-50 text-blue-600 border-blue-200" };
  if (rank <= 20) return { rate: "1.0%", label: "Tier 2", color: "bg-purple-50 text-purple-600 border-purple-200" };
  return           { rate: "1.5%", label: "Tier 3", color: "bg-amber-50 text-amber-600 border-amber-200" };
}

function ReferralList({
  referrals,
  referredCount,
  totalEarned,
  t,
}: {
  referrals: ReferralItem[];
  referredCount: number;
  totalEarned: number;
  t: ReturnType<typeof useTranslation<"referral">>;
}) {
  // Active tier badge for current user
  const currentTier =
    referredCount === 0 ? null :
    referredCount <= 5  ? { label: "Tier 1 · 0.5%", color: "bg-blue-500"   } :
    referredCount <= 20 ? { label: "Tier 2 · 1.0%", color: "bg-purple-500" } :
                          { label: "Tier 3 · 1.5%", color: "bg-amber-500"  };

  return (
    <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">

      {/* Section header */}
      <div className="px-5 py-4 border-b border-ap-border bg-ap-bg/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-bold text-ap-primary">{t.listTitle}</p>
            <p className="text-[12px] text-ap-tertiary mt-0.5">{t.listTotal.replace("{n}", String(referredCount))}</p>
          </div>
          {currentTier && (
            <span className={`text-[11px] font-bold text-white ${currentTier.color} rounded-full px-3 py-1`}>
              {currentTier.label}
            </span>
          )}
        </div>

        {/* Summary bar */}
        {referrals.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl p-2.5 text-center border border-ap-border">
              <p className="text-[16px] font-bold text-ap-blue tabular-nums">{referredCount}</p>
              <p className="text-[10px] text-ap-tertiary">{t.totalFriends}</p>
            </div>
            <div className="bg-white rounded-xl p-2.5 text-center border border-ap-border">
              <p className="text-[16px] font-bold text-ap-green tabular-nums">
                ฿{totalEarned.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-ap-tertiary">{t.bonusTotal}</p>
            </div>
            <div className="bg-white rounded-xl p-2.5 text-center border border-ap-border">
              <p className="text-[16px] font-bold text-ap-orange tabular-nums">
                {referredCount > 0
                  ? `฿${(totalEarned / referredCount).toLocaleString("th-TH", { maximumFractionDigits: 2 })}`
                  : "—"}
              </p>
              <p className="text-[10px] text-ap-tertiary">{t.avgPerPerson}</p>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      {referrals.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3 text-[32px]">
            👥
          </div>
          <p className="text-[14px] font-semibold text-ap-secondary">{t.emptyTitle}</p>
          <p className="text-[12px] text-ap-tertiary mt-1 leading-relaxed">{t.emptyDesc}</p>
        </div>
      ) : (
        <>
          {/* Column labels */}
          <div className="grid grid-cols-[32px_1fr_auto] gap-3 px-5 py-2 bg-ap-bg/30 border-b border-ap-border">
            <span className="text-[10px] font-semibold text-ap-tertiary uppercase">#</span>
            <span className="text-[10px] font-semibold text-ap-tertiary uppercase">{t.colMember}</span>
            <span className="text-[10px] font-semibold text-ap-tertiary uppercase text-right">{t.colBonus}</span>
          </div>

          <div className="divide-y divide-ap-border">
            {referrals.map((r, index) => {
              const rank    = index + 1;
              const phoneRaw = r.referee?.phone ?? r.phone ?? "";
              const nameRaw =
                r.referee?.displayName ??
                r.referee?.display_name ??
                r.display_name ??
                r.name ??
                null;
              const name = nameRaw || (phoneRaw ? maskPhone(phoneRaw) : "สมาชิก");
              const phone = phoneRaw ? maskPhone(phoneRaw) : "-";
              const earned  = toNumber(r.totalEarned ?? r.total_earned);
              const joinedRaw = r.createdAt ?? r.created_at ?? r.referee?.createdAt ?? r.referee?.created_at ?? "";
              const joinedDate = joinedRaw ? new Date(joinedRaw) : null;
              const joined  = joinedDate && !Number.isNaN(joinedDate.getTime())
                ? joinedDate.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })
                : "-";
              const tier    = commissionRate(rank);
              const initial = String(name).slice(0, 1).toUpperCase();

              // Avatar color cycle
              const avatarColors = [
                "bg-blue-100 text-blue-600",
                "bg-purple-100 text-purple-600",
                "bg-amber-100 text-amber-600",
                "bg-green-100 text-green-600",
                "bg-rose-100 text-rose-600",
              ];
              const avatarColor = avatarColors[(rank - 1) % avatarColors.length];

              return (
                <div key={String(r.id ?? rank)} className="flex items-center gap-3 px-5 py-3.5 hover:bg-ap-bg/40 transition-colors">

                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    {rank <= 3 ? (
                      <span className="text-[18px]">
                        {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                      </span>
                    ) : (
                      <span className="text-[12px] font-bold text-ap-tertiary tabular-nums">{rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold flex-shrink-0 ${avatarColor}`}>
                    {initial}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-semibold text-ap-primary truncate">{name}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${tier.color}`}>
                        {tier.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-ap-tertiary">
                      <span>{phone}</span>
                      <span>·</span>
                      <span>{t.joined} {joined}</span>
                    </div>
                  </div>

                  {/* Bonus */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-[14px] font-bold tabular-nums ${earned > 0 ? "text-ap-green" : "text-ap-tertiary"}`}>
                      ฿{earned.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-ap-tertiary">{tier.rate}{t.perBet}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer total */}
          <div className="px-5 py-3.5 border-t border-ap-border bg-ap-bg/40 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ap-secondary">{t.footerTotal}</span>
            <span className="text-[16px] font-bold text-ap-green tabular-nums">
              ฿{totalEarned.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
