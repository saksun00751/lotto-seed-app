"use client";

import { useEffect, useState } from "react";
import { mapMarketsToCategories } from "@/lib/api/lotto";
import type { MarketsLatestResponse } from "@/lib/api/lotto";
import type { Category, SubItem } from "@/lib/categories";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLang } from "@/lib/i18n/context";
import PackageModalButton from "@/components/bet/PackageModalButton";

function StatusBadge({ status, label }: { status: SubItem["drawStatus"]; label?: string }) {
  const text = label?.trim() || "—";
  if (status === "open")
    return <span className="inline-flex h-[34px] items-center rounded-full px-4 text-[13px] font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm">{text}</span>;
  if (status === "closed")
    return <span className="inline-flex h-[34px] items-center rounded-full px-4 text-[13px] font-semibold bg-slate-200 text-slate-600 border border-slate-300">{text}</span>;
  if (status === "resulted")
    return <span className="inline-flex h-[34px] items-center rounded-full px-4 text-[13px] font-bold bg-rose-100 text-rose-600 border border-rose-200">{text}</span>;
  return <span className="inline-flex h-[34px] items-center rounded-full px-4 text-[13px] font-bold bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-sm">{text}</span>;
}

interface LotteryCategoriesProps {
  initialCategories?: Category[];
}

export default function LotteryCategories({ initialCategories = [] }: LotteryCategoriesProps) {
  const t = useTranslation("dashboard");
  const { lang } = useLang();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading]       = useState(initialCategories.length === 0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/lotto/markets")
      .then((r) => r.json())
      .then((res: MarketsLatestResponse) => {
        if (!cancelled && res?.data?.groups) {
          setCategories(mapMarketsToCategories(res.data.groups));
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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-ap-border overflow-hidden animate-pulse bg-white shadow-card">
            <div className="h-11 bg-sky-200/70" />
            <div className="h-10 px-4 bg-sky-50 border-b border-slate-200" />
            <div className="bg-slate-50/50 p-3 space-y-2.5">
              {[1, 2, 3].map((j) => (
                <div key={j} className="rounded-xl bg-white border border-slate-200/80 px-3.5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 rounded bg-slate-200" />
                      <div className="h-2.5 w-20 rounded bg-slate-200" />
                    </div>
                    <div className="h-7 w-16 rounded-full bg-slate-200" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="h-8 rounded-lg bg-slate-200/70" />
                    <div className="h-8 rounded-lg bg-slate-200/70" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!categories.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-[18px] font-bold text-ap-primary tracking-tight flex items-center gap-2">
        <span className="emoji-font text-[20px]">🏆</span>
        <span>{t.todayLottery}</span>
      </h2>

      {categories.map((cat: Category) => (
        <div key={cat.id} className="rounded-2xl border border-sky-100 shadow-card hover:shadow-card-hover transition-all overflow-hidden bg-white">

          <div className="relative bg-gradient-to-r from-[#0468ce] via-[#0a7bde] to-[#20a4ff] px-4 py-2.5 flex items-center gap-2 overflow-hidden">
            <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.12)_0%,transparent_48%,rgba(255,255,255,0.08)_100%)]" />
            <span className="relative text-[18px]">{cat.emoji}</span>
            <span className="text-white font-bold text-[14px] tracking-tight">{cat.label}</span>
         
            <span className="ml-auto relative bg-white/95 text-ap-blue text-[13px] font-bold rounded-full px-3 py-1 border border-white shadow-sm">
              {cat.items.length} {t.itemsCount}
            </span>
          </div>

          {cat.description && (
            <div className="px-4 py-2.5 bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
              <p className="text-[14px] text-slate-600 leading-relaxed">{cat.description}</p>
            </div>
          )}

          <div className="bg-slate-50/50 p-3 space-y-2.5">
            {cat.items.map((item: SubItem) => (
              <div
                key={item.id}
                className="rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all px-3.5 py-3"
              >
                <div className="flex items-center gap-3">
                  {item.logo
                    ? <img src={item.logo} alt={item.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    : <span className="text-[26px] flex-shrink-0 emoji-font leading-none">{item.flag}</span>}
                  <div className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold text-ap-primary truncate leading-tight">{item.name}</span>
                    <span className="block text-[12px] text-ap-tertiary truncate mt-0.5">
                      {t.colDraw} {item.drawDate ?? "—"}
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    {item.drawStatus === "open" && cat.groupId != null && item.drawId != null ? (
                      <PackageModalButton
                        groupId={cat.groupId}
                        drawId={item.drawId}
                        locale={lang}
                        closeAt={item.closeAt}
                      />
                    ) : (
                      <StatusBadge status={item.drawStatus} label={item.statusLabel} />
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-1.5">
                    <span className="text-[12px] font-semibold text-slate-600">{t.colTop3}</span>
                    {item.result?.top3
                      ? <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[13px] font-bold tabular-nums rounded-md min-w-[42px] text-center px-2 py-0.5 shadow-sm">{item.result.top3}</span>
                      : <span className="text-ap-tertiary text-[15px]">—</span>}
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-1.5">
                    <span className="text-[12px] font-semibold text-slate-600">{t.colBot2}</span>
                    {item.result?.bot2
                      ? <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[13px] font-bold tabular-nums rounded-md min-w-[42px] text-center px-2 py-0.5 shadow-sm">{item.result.bot2}</span>
                      : <span className="text-ap-tertiary text-[15px]">—</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      ))}
    </section>
  );
}
