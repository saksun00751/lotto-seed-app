import type { Metadata } from "next";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet } from "@/lib/api/client";
import type { MarketsLatestResponse } from "@/lib/api/lotto";
import CheckResultPage from "@/components/check-result/CheckResultPage";
import type { Ticket } from "@/app/[locale]/(protected)/history/page";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: await getPageMetaTitle(locale, "checkResult") };
}

interface TicketsResponse {
  success: boolean;
  data:    Ticket[];
}

export default async function CheckResultRoute() {
  const [token, lang] = await Promise.all([getApiToken(), getLangCookie()]);

  let groups: MarketsLatestResponse["data"]["groups"] = [];
  let tickets: Ticket[] = [];

  try {
    const [marketsRes, ticketsRes] = await Promise.all([
      apiGet<MarketsLatestResponse>("/lotto/markets/latest", token ?? undefined, lang),
      apiGet<TicketsResponse>("/lotto/tickets", token ?? undefined, lang),
    ]);
    groups  = marketsRes?.data?.groups ?? [];
    tickets = ticketsRes?.data ?? [];
  } catch {}

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <CheckResultPage groups={groups} tickets={tickets} />
    </div>
  );
}
