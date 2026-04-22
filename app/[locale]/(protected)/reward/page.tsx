import type { Metadata } from "next";
import RewardPage from "@/components/reward/RewardPage";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: await getPageMetaTitle(locale, "reward") };
}

export default async function RewardRoute({ params }: Props) {
  const { locale } = await params;
  return <RewardPage locale={locale} />;
}
