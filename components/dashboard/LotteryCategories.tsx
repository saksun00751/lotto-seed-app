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
    return <span className="inline-block rounded-full px-3 py-0.5 text-[11px] font-bold bg-emerald-500 text-white">{text}</span>;
  if (status === "closed")
    return <span className="inline-block rounded-full px-3 py-0.5 text-[11px] font-bold bg-gray-300 text-gray-600">{text}</span>;
  if (status === "resulted")
    return <span className="inline-block rounded-full px-3 py-0.5 text-[11px] font-bold bg-red-100 text-red-600">{text}</span>;
  return <span className="inline-block rounded-full px-3 py-0.5 text-[11px] font-bold bg-orange-400 text-white">{text}</span>;
}

export default function LotteryCategories() {
  const t = useTranslation("dashboard");
  const { lang } = useLang();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetch("/api/lotto/markets")
      .then((r) => r.json())
      .then((res: MarketsLatestResponse) => {
        if (res?.data?.groups) {
          setCategories(mapMarketsToCategories(res.data.groups));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-ap-border overflow-hidden animate-pulse">
            <div className="h-10 bg-gray-200" />
            <div className="bg-white divide-y divide-ap-border">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-10 px-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200" />
                  <div className="h-3 w-32 rounded bg-gray-200" />
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
      <h2 className="text-[17px] font-bold text-ap-primary tracking-tight">🏆 {t.todayLottery}</h2>

      {categories.map((cat: Category) => (
        <div key={cat.id} className="rounded-2xl border border-ap-border shadow-card overflow-hidden">

          <div className="bg-gradient-to-r from-ap-blue to-sky-400 px-4 py-2.5 flex items-center gap-2">
            <span className="text-[18px]">{cat.emoji}</span>
            <span className="text-white font-bold text-[14px] tracking-tight">{cat.label}</span>
         
            <span className="ml-auto bg-white text-ap-blue text-[11px] font-bold rounded-full px-2.5 py-0.5">{cat.items.length} {t.itemsCount}</span>
          </div>

          {cat.description && (
            <div className="px-4 py-2 bg-blue-50 border-b border-ap-border">
              <p className="text-[12px] text-ap-secondary leading-relaxed">{cat.description}</p>
            </div>
          )}

          <div className="grid grid-cols-[1fr_60px_60px_90px] sm:grid-cols-[1fr_100px_72px_72px_110px] px-3 py-2 bg-gray-50 border-b border-ap-border text-[11px] font-semibold text-ap-tertiary text-center">
            <span className="text-left">{t.colLottery}</span>
            <span className="hidden sm:block">{t.colDraw}</span>
            <span>{t.colTop3}</span>
            <span>{t.colBot2}</span>
            <span>{t.colStatus}</span>
          </div>

          <div className="bg-white">
            {cat.items.map((item: SubItem) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_60px_60px_90px] sm:grid-cols-[1fr_100px_72px_72px_110px] px-3 py-2.5 border-b border-ap-border last:border-0 items-center"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.logo
                    ? <img src={item.logo} alt={item.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                    : <span className="text-[18px] flex-shrink-0">{item.flag}</span>}
                  <div className="min-w-0">
                    <span className="block text-[12px] font-semibold text-ap-primary truncate">{item.name}</span>
                    <span className="block sm:hidden text-[10px] text-ap-secondary truncate">
                      {t.colDraw} {item.drawDate ?? "—"}
                    </span>
                  </div>
                </div>
                <div className="hidden sm:block text-center text-[11px] text-ap-secondary tabular-nums">
                  {item.drawDate ?? "—"}
                </div>
                <div className="flex justify-center">
                  {item.result?.top3
                    ? <span className="bg-teal-500 text-white text-[13px] font-bold tabular-nums rounded-md px-2 py-0.5">{item.result.top3}</span>
                    : <span className="text-ap-tertiary text-[12px]">—</span>}
                </div>
                <div className="flex justify-center">
                  {item.result?.bot2
                    ? <span className="bg-teal-500 text-white text-[13px] font-bold tabular-nums rounded-md px-2 py-0.5">{item.result.bot2}</span>
                    : <span className="text-ap-tertiary text-[12px]">—</span>}
                </div>
                <div className="flex justify-center px-1">
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
            ))}
          </div>

        </div>
      ))}
    </section>
  );
}
