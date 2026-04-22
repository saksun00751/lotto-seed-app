import type { Metadata } from "next";
import SpinHistoryPage from "@/components/spin/SpinHistoryPage";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet } from "@/lib/api/client";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: await getPageMetaTitle(locale, "spinHistory") };
}

interface HistoryResponse {
  success: boolean;
  data?: {
    history?: Array<{
      date: string;
      data: Array<{ credit: string; time: string }>;
    }>;
  };
}

export default async function SpinHistoryRoute() {
  const [apiToken, lang] = await Promise.all([getApiToken(), getLangCookie()]);

  let groups: Array<{ date: string; data: Array<{ credit: string; time: string }> }> = [];
  try {
    const res = await apiGet<HistoryResponse>("/wheel/history", apiToken ?? undefined, lang);
    const raw = res?.data?.history ?? [];

    // Merge items with the same date
    const map = new Map<string, Array<{ credit: string; time: string }>>();
    for (const group of raw) {
      const existing = map.get(group.date);
      if (existing) existing.push(...group.data);
      else map.set(group.date, [...group.data]);
    }
    groups = Array.from(map.entries()).map(([date, data]) => ({ date, data }));
  } catch {}

  return <SpinHistoryPage groups={groups} />;
}
