import type { Metadata } from "next";
import TransactionsPageClient from "@/components/transactions/TransactionsPageClient";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";

interface Props {
  params?: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params)?.locale ?? "th";
  return { title: await getPageMetaTitle(locale, "transactions") };
}

export default async function TransactionsPage({ params }: Props) {
  const { locale } = (await params) ?? { locale: "th" };
  const apiBase = process.env.API_BASE_URL ?? "https://api.huayinter88.com/api/v1";
  return <TransactionsPageClient locale={locale} apiBase={apiBase} />;
}
