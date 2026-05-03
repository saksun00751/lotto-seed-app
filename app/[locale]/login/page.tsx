import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginPageClient from "@/components/auth/LoginPageClient";
import { getSiteMeta, getLogoUrl } from "@/lib/api/site";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";
import { getCurrentUser } from "@/lib/session/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: await getPageMetaTitle(locale, "login") };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { locale }  = await params;
  const user        = await getCurrentUser();
  if (user) redirect(`/${locale}/dashboard`);
  const sp          = await searchParams;
  const expired     = sp.expired === "1";
  const meta        = await getSiteMeta();
  const logoUrl     = meta ? getLogoUrl(meta.logo) : "/logo.png";

  return (
    <main className="min-h-screen bg-ap-bg flex flex-col items-center justify-center p-5">

      {/* Soft background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-ap-blue/[0.035] blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-ap-blue/[0.03] blur-3xl" />
      </div>

      <LoginPageClient initialLang={locale} expired={expired} logoUrl={logoUrl} />
    </main>
  );
}
