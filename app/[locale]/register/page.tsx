import type { Metadata } from "next";
import RegisterPageClient from "@/components/auth/RegisterPageClient";
import RegisterWithUsernamePageClient from "@/components/auth/RegisterWithUsernamePageClient";
import type { BankOption } from "@/components/auth/RegisterForm";
import { getSiteMeta, getLogoUrl } from "@/lib/api/site";
import { getBanks } from "@/lib/api/banks";
import { getRegisterClientVariant } from "@/lib/config/register";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";

interface Props {
  params?: Promise<{ locale: string }>;
  searchParams?: Promise<{ ref?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params)?.locale ?? "th";
  return { title: await getPageMetaTitle(locale, "register") };
}

export default async function RegisterPage({ params, searchParams }: Props) {
  const { locale } = (await params) ?? { locale: "th" };
  const query      = await searchParams;
  const defaultRef = (query?.ref ?? "").toUpperCase();
  const registerClient = getRegisterClientVariant();
  const RegisterClient = registerClient === "registerWithUsername"
    ? RegisterWithUsernamePageClient
    : RegisterPageClient;

  let banks: BankOption[] = [];
  try {
    const bankOptions = await getBanks();
    banks = bankOptions.map((b) => ({
      code:      b.code,
      name_th:   b.name_th,
      shortcode: b.shortcode,
      image:     b.image_url,
    }));
  } catch {}

  const meta    = await getSiteMeta();
  const logoUrl = meta ? getLogoUrl(meta.logo) : "/logo.png";

  return (
    <main className="min-h-screen bg-ap-bg flex flex-col items-center justify-center p-5">

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-ap-green/[0.04] blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-ap-blue/[0.03] blur-3xl" />
      </div>

      <RegisterClient initialLang={locale} defaultRef={defaultRef} banks={banks} logoUrl={logoUrl} />
    </main>
  );
}
