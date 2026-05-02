"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { mapMarketsToCategories } from "@/lib/api/lotto";
import type { MarketsLatestResponse } from "@/lib/api/lotto";
import type { Category } from "@/lib/categories";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLang } from "@/lib/i18n/context";

const LOTTO_BG_GRADIENTS = [
  "from-blue-700 to-red-600",
  "from-emerald-600 to-teal-400",
  "from-sky-600 to-cyan-400",
  "from-yellow-500 to-orange-500",
  "from-violet-600 to-purple-400",
  "from-rose-500 to-pink-400",
];

function CategoryCard({
  cat,
  playLabel,
  liveLabel,
  emptyDescription,
  locale,
  gradientClass,
}: {
  cat: Category;
  playLabel: string;
  liveLabel: string;
  emptyDescription: string;
  locale: string;
  gradientClass: string;
}) {
  const code = cat.code ?? cat.id;
  const openCount = cat.items.filter((i) => i.isOpen).length;

  return (
    <Link
      href={`/${locale}/category/${code}`}
      className={`bg-gradient-to-br ${gradientClass} rounded-2xl relative overflow-hidden group active:scale-[0.98] transition-all shadow-card p-4 h-[150px] flex flex-col justify-between`}
    >
      <span className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
      <span className="absolute -bottom-6 -right-2 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

      <div>
        <div className="font-bold tracking-tight leading-tight text-[15px] text-white flex items-center gap-2">
          {cat.groupLogo ? (
            <img src={cat.groupLogo} alt={cat.label} className="w-6 h-6 object-cover shrink-0" />
          ) : null}
          <span className="truncate">{cat.label}</span>
        </div>
        <div className="text-white/70 mt-0.5 text-[14px] h-[36px] overflow-hidden">
          {cat.description || emptyDescription}
        </div>
      </div>

      <div className="mt-3 h-[24px] flex items-center gap-2">
        <span className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 transition-colors rounded-full px-3 py-1 text-[14px] font-semibold text-white">
          {playLabel}
        </span>
        {openCount > 0 && (
          <span className="flex items-center gap-1 text-[14px] font-medium bg-white/20 rounded-full px-2 py-0.5 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse inline-block" />
            {openCount} {liveLabel}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function LotteryGroups() {
  const t = useTranslation("bet");
  const { lang } = useLang();
  const [groups, setGroups] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/lotto/markets")
      .then((r) => r.json())
      .then((res: MarketsLatestResponse) => {
        if (!cancelled && res?.data?.groups) {
          setGroups(mapMarketsToCategories(res.data.groups));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
        <div className="bg-gradient-to-r from-ap-blue to-sky-400 px-4 py-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-white tracking-tight">{t.lotto}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[150px] rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!groups.length) return null;

  return (
    <section className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
      <div className="bg-gradient-to-r from-ap-blue to-sky-400 px-4 py-3 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-white tracking-tight">{t.lotto}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
        {groups.map((cat, idx) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            playLabel={t.play}
            liveLabel={t.live}
            emptyDescription={t.emptyDescription}
            locale={lang}
            gradientClass={LOTTO_BG_GRADIENTS[idx % LOTTO_BG_GRADIENTS.length]}
          />
        ))}
      </div>
    </section>
  );
}
