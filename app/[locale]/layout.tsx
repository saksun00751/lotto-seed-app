import type { Metadata } from "next";
import ProgressBar from "@/components/ui/ProgressBar";
import { LangProvider } from "@/lib/i18n/context";
import { getSiteMeta, getLogoUrl } from "@/lib/api/site";
import { Toaster } from "sonner";
import ApiErrorToastListener from "@/components/providers/ApiErrorToastListener";
import ToastSoundBridge from "@/components/providers/ToastSoundBridge";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const data = await getSiteMeta();
    if (!data) throw new Error("no data");
    const imageUrl = getLogoUrl(data.logo);
    return {
      title: data.name,
      description: data.description,
      icons: {
        icon: [{ url: imageUrl }],
        shortcut: [{ url: imageUrl }],
        apple: [{ url: imageUrl }],
      },
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
      title: "",
      description: " สนุกทุกเกมดัง สล็อต คาสิโน กีฬา",
      icons: {
        icon: [{ url: "/logo.png" }],
        shortcut: [{ url: "/logo.png" }],
        apple: [{ url: "/logo.png" }],
      },
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
      <ToastSoundBridge />
      <Toaster
        position="top-center"
        offset={20}
        richColors
        expand
        gap={12}
        toastOptions={{
          duration: 3600,
          classNames: {
            toast: "app-toast",
            content: "app-toast-content",
            title: "app-toast-title",
            icon: "app-toast-icon",
            closeButton: "app-toast-close",
            success: "app-toast-success",
            error: "app-toast-error",
            warning: "app-toast-warning",
            info: "app-toast-info",
          },
        }}
      />
      {children}
    </LangProvider>
  );
}
