import type { Metadata } from "next";
import Navbar from "@/components/layout/NavbarServer";
import ResultsPage from "@/components/results/ResultsPage";
import { requireAuth } from "@/lib/session/auth";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: await getPageMetaTitle(locale, "results") };
}

export default async function ResultsRoute() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Navbar />
      <ResultsPage />
    </div>
  );
}
