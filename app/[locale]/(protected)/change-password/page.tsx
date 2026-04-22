import type { Metadata } from "next";
import ChangePasswordModal from "@/components/profile/ChangePasswordModal";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: await getPageMetaTitle(locale, "changePassword") };
}

export default async function ChangePasswordPage() {
  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <ChangePasswordModal hasPassword />
    </div>
  );
}
