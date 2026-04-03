import type { Metadata } from "next";
import TransactionsPageClient from "@/components/transactions/TransactionsPageClient";

export const metadata: Metadata = { title: "ประวัติการเงิน — Lotto" };

interface Props {
  params?: Promise<{ locale: string }>;
}

export default async function TransactionsPage({ params }: Props) {
  const { locale } = (await params) ?? { locale: "th" };
  const apiBase = process.env.API_BASE_URL ?? "https://api.1168lot.com/api/v1";
  return <TransactionsPageClient locale={locale} apiBase={apiBase} />;
}
