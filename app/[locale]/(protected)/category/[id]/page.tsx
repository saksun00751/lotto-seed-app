import CountdownTimer from "@/components/ui/CountdownTimer";
import PackageModalButton from "@/components/bet/PackageModalButton";
import BetToastNotice from "@/components/bet/BetToastNotice";
import BackButton from "@/components/ui/BackButton";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet } from "@/lib/api/client";
import { mapMarketsToCategories } from "@/lib/api/lotto";
import type { MarketsLatestResponse } from "@/lib/api/lotto";
import { getTranslation } from "@/lib/i18n/getTranslation";
import { withTitleSuffix } from "@/lib/i18n/metaTitle";
import type { Category, SubItem } from "@/lib/categories";
import { Suspense } from "react";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: await withTitleSuffix(id) };
}

// ─── Sub-item card ──────────────────────────────────────────────────────────────
interface CategoryTranslation {
  titleNotFound: string;
  live: string;
  drawn: string;
  top3: string;
  bot2: string;
  playNow: string;
  closed: string;
  closedRefreshing: string;
  viewPast: string;
  comingSoon: string;
  items: string;
  liveItems: string;
  selectPackage: string;
  noPackage: string;
}

function SubItemCard({ item, t, groupId, locale }: { item: SubItem; t: CategoryTranslation; groupId: number; locale: string }) {
  return (
    <div className="bg-white rounded-2xl border border-ap-border shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5 overflow-hidden h-full">
      <div className={`h-[3px] bg-gradient-to-r ${item.barClass}`} />
      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            {item.logo ? (
              <img
                src={item.logo}
                alt={item.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <span className="text-[24px]">{item.flag}</span>
            )}
            <div>
              <div className="text-[13px] font-semibold text-ap-primary leading-tight">{item.name}</div>
              <div className="text-[11px] text-ap-tertiary mt-0.5">{item.sub}</div>
            </div>
          </div>
          {item.isOpen ? (
            <span className="flex items-center gap-1 text-[10px] font-medium text-ap-red bg-ap-red/8 px-2 py-0.5 rounded-full border border-ap-red/15 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-ap-red animate-pulse inline-block" />
              {t.live}
            </span>
          ) : (
            <span className="text-[10px] font-medium text-ap-green bg-ap-green/8 px-2 py-0.5 rounded-full border border-ap-green/15 flex-shrink-0">
              ✓ {t.drawn}
            </span>
          )}
        </div>

        {/* Result or countdown */}
        {item.result ? (
          <div className="grid grid-cols-2 gap-1.5 h-[68px] mb-3">
            <div className="bg-ap-bg rounded-xl p-2 text-center flex flex-col justify-center">
              <div className="text-[20px] font-bold text-ap-primary tabular-nums">{item.result.top3}</div>
              <div className="text-[10px] text-ap-tertiary">{t.top3}</div>
            </div>
            <div className="bg-ap-bg rounded-xl p-2 text-center flex flex-col justify-center">
              <div className="text-[20px] font-bold text-ap-primary tabular-nums">{item.result.bot2}</div>
              <div className="text-[10px] text-ap-tertiary">{t.bot2}</div>
            </div>
          </div>
        ) : (
          <div className="text-center h-[68px] flex flex-col items-center justify-center mb-3">
            {item.closeAt
              ? <CountdownTimer closeAt={item.closeAt} className="text-[22px] font-bold text-ap-primary tabular-nums tracking-wide" showCurrentTime expiredText="—" />
              : <span className="text-[22px] font-bold text-ap-primary tabular-nums tracking-wide">{item.countdown ?? "—"}</span>
            }
          </div>
        )}

        {/* Action */}
        <div className="mt-auto">
          {item.isOpen ? (
            <PackageModalButton
              groupId={groupId}
              drawId={item.drawId ?? 0}
              locale={locale}
              closeAt={item.closeAt}
              labelPlay={t.playNow}
              labelClosed={t.closed}
              labelSelect={t.selectPackage}
              labelNoPackage={t.noPackage}
              toastClosedRefresh={t.closedRefreshing}
            />
          ) : (
            <button className="block w-full text-center bg-ap-bg border border-ap-border text-ap-secondary rounded-full py-2 text-[12px] font-medium cursor-default">
              {t.viewPast}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Coming soon ────────────────────────────────────────────────────────────────
function ComingSoon({ emoji, label, t }: { emoji: string; label: string; t: CategoryTranslation }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-[64px] mb-4">{emoji}</div>
      <h2 className="text-[20px] font-bold text-ap-primary mb-2">{label}</h2>
      <p className="text-[14px] text-ap-tertiary">{t.comingSoon}</p>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default async function CategoryPage({ params }: Props) {
  const { locale, id } = await params;

  const [apiToken, lang] = await Promise.all([
    getApiToken(),
    getLangCookie(),
  ]);
  const t = getTranslation(lang, "category");

  let cat: Category | undefined;
  try {
    const res = await apiGet<MarketsLatestResponse>(
      `/lotto/markets/latest?code=${encodeURIComponent(id)}`,
      apiToken ?? undefined,
      lang,
    );
    if (res?.data?.groups) {
      const categories = mapMarketsToCategories(res.data.groups);
      cat = categories.find((c) => c.id === id || c.code === id);
    }
  } catch {}

  if (!cat) notFound();
  const openCount = cat.items.filter((i) => i.isOpen).length;

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Suspense fallback={null}>
        <BetToastNotice />
      </Suspense>
      <div className="max-w-5xl mx-auto px-5 pt-6">

        {/* Back + header */}
        <div className="flex items-center gap-3 mb-6">
          <BackButton
            fallbackHref={`/${locale}/dashboard`}
            className="w-8 h-8 rounded-xl bg-white border border-ap-border flex items-center justify-center shadow-sm hover:bg-ap-bg transition-colors"
          >
            <svg className="w-4 h-4 text-ap-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </BackButton>
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-[20px] shadow-sm`}
          >
            {cat.emoji}
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-ap-primary leading-tight">{cat.label}</h1>
            {openCount > 0 ? (
              <p className="text-[12px] text-ap-red font-medium">🔴 {openCount} {t.liveItems}</p>
            ) : (
              <p className="text-[12px] text-ap-tertiary">{cat.items.length} {t.items}</p>
            )}
          </div>
        </div>

        {/* Items or coming soon */}
        {cat.items.length === 0 ? (
          <ComingSoon emoji={cat.emoji} label={cat.label} t={t} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {cat.items.map((item) => (
              <SubItemCard key={item.id} item={item} t={t} groupId={cat.groupId ?? 0} locale={locale} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
