import type { Metadata } from "next";
import BalanceCard from "@/components/dashboard/BalanceCard";
import { requireAuth } from "@/lib/session/auth";
import { logoutAction } from "@/lib/actions";
import { apiGet } from "@/lib/api/client";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { getTranslation } from "@/lib/i18n/getTranslation";

export const metadata: Metadata = { title: "ข้อมูลสมาชิก — Lotto" };

interface ApiBankItem {
  code:      number;
  name_th:   string;
  shortcode: string;
  image_url: string;
}
interface BanksResponse {
  data?: { banks?: ApiBankItem[] };
}

interface LoadBalanceProfile {
  name:     string;
  bank_code: number;
  acc_no:   string;
}
interface LoadBalanceResponse {
  success:  boolean;
  profile:  LoadBalanceProfile;
}

/** Format 10-digit phone → 0XX-XXX-XXXX */
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}


interface Props {
  params?: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const [{ locale }, user, apiToken, lang] = await Promise.all([
    params ?? Promise.resolve({ locale: "th" }),
    requireAuth(),
    getApiToken(),
    getLangCookie(),
  ]);
  const t = getTranslation(lang, "profile");

  let bankOptions: ApiBankItem[] = [];
  let bankName:    string | null = null;
  let accNo:       string | null = null;
  let accName:     string | null = null;

  const [banksRes, loadbalanceRes] = await Promise.allSettled([
    apiGet<BanksResponse>("/auth/register/banks"),
    apiGet<LoadBalanceResponse>("/member/loadbalance", apiToken ?? undefined, lang),
  ]);

  if (banksRes.status === "fulfilled" && banksRes.value?.data?.banks) {
    bankOptions = banksRes.value.data.banks;
  }
  if (loadbalanceRes.status === "fulfilled" && loadbalanceRes.value?.profile) {
    const p = loadbalanceRes.value.profile;
    accNo    = p.acc_no   || null;
    accName  = p.name     || null;
    bankName = bankOptions.find((b) => b.code === p.bank_code)?.name_th ?? null;
  }
  const displayName  = user.displayName ?? t.member;

  const menuSections = [
    {
      title: t.menuAccountTitle,
      items: [
        { href: "/history",      icon: "📋", label: t.menuBetsLabel,    desc: t.menuBetsDesc },
        { href: "/transactions", icon: "💳", label: t.menuFinanceLabel, desc: t.menuFinanceDesc },
      ],
    },
    {
      title: t.menuSettingsTitle,
      items: [
        { href: "/change-password", icon: "🔐", label: t.menuPasswordLabel, desc: t.menuPasswordDesc },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <div className="max-w-5xl mx-auto px-5 pt-6 space-y-5">

        {/* Balance Card */}
        <BalanceCard phone={formatPhone(user.phone)} displayName={displayName} />

        {/* Bank account */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl shadow-card p-5">
          <p className="text-[12px] text-white/70 uppercase tracking-wide font-medium mb-2 flex items-center gap-1.5">
            <span aria-hidden>🏦</span>
            <span>{t.bankAccount}</span>
          </p>
          {accNo ? (
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-4 items-end">
              <div className="space-y-1.5">
                <p className="text-[18px] leading-tight font-semibold text-white/80">{bankName || "-"}</p>
                <p className="text-[22px] leading-tight font-bold text-white">{accName || "-"}</p>
              </div>
              <p className="text-[22px] leading-tight font-bold text-white tabular-nums tracking-wide break-all sm:text-right">{accNo}</p>
            </div>
          ) : (
            <p className="text-[13px] text-white/70">{t.noBank}</p>
          )}
        </div>

        {/* Menu sections */}
        {menuSections.map((section) => (
          <div key={section.title} className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
            <div className="px-5 py-3 border-b border-ap-border">
              <p className="text-[12px] font-semibold text-ap-tertiary uppercase tracking-wide">{section.title}</p>
            </div>
            <div className="divide-y divide-ap-border">
              {section.items.map((item) => (
                <a key={item.href} href={`/${locale}${item.href}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-ap-bg/60 transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-ap-bg flex items-center justify-center text-[18px] flex-shrink-0 group-hover:bg-ap-blue/5 transition-colors">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-ap-primary">{item.label}</p>
                    <p className="text-[12px] text-ap-tertiary mt-0.5">{item.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-ap-tertiary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
          <form action={logoutAction}>
            <button type="submit"
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-ap-red/5 transition-colors text-left">
              <div className="w-9 h-9 rounded-xl bg-ap-red/8 flex items-center justify-center text-[18px] flex-shrink-0">
                🚪
              </div>
              <span className="text-[14px] font-semibold text-ap-red">{t.logout}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-ap-tertiary pb-2">
          {t.version}
        </p>
      </div>
    </div>
  );
}
