import type { Metadata } from "next";
import ProgressBar from "@/components/ui/ProgressBar";
import { LangProvider } from "@/lib/i18n/context";
import { getSiteMeta, getLogoUrl } from "@/lib/api/site";
import { Toaster } from "sonner";
import ApiErrorToastListener from "@/components/providers/ApiErrorToastListener";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const data = await getSiteMeta();
    if (!data) throw new Error("no data");
    const imageUrl = getLogoUrl(data.logo);
    return {
      title: data.name,
      description: data.description,
      openGraph: {
        title: data.title,
        description: data.description,
        siteName: data.name,
        images: [{ url: imageUrl }],
      },
      twitter: {
        card: "summary_large_image",
        title: data.title,
        description: data.description,
        images: [imageUrl],
      },
    };
  } catch {
    return {
      title: "1168lot.com",
      description: "1168lot สนุกทุกเกมดัง สล็อต คาสิโน กีฬา",
    };
  }
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <LangProvider initialLang={locale}>
      <ProgressBar />
      <ApiErrorToastListener />
      <Toaster position="top-center" richColors />
      {children}
    </LangProvider>
  );
}
