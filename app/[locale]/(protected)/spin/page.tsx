import type { Metadata } from "next";
import SpinPage from "@/components/spin/SpinPage";
import { requireAuth } from "@/lib/session/auth";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet } from "@/lib/api/client";
import type { WheelSegment } from "@/components/spin/SpinPage";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: await getPageMetaTitle(locale, "spin") };
}

interface WheelListResponse {
  success: boolean;
  data?: {
    wheel?:   ApiWheelItem[];
    enabled?: boolean;
  };
}

interface ApiWheelItem {
  code:      number;
  fillStyle: string;
  image:     string;
  text:      string;
  amount:    string;
  name:      string;
  types:     string;
}

export default async function SpinRoute() {
  const [user, apiToken, lang] = await Promise.all([
    requireAuth(),
    getApiToken(),
    getLangCookie(),
  ]);

  let segments: WheelSegment[] = [];
  let wheelEnabled = true;
  try {
    const res = await apiGet<WheelListResponse>("/wheel/list", apiToken ?? undefined, lang);
    wheelEnabled = res?.data?.enabled ?? true;
    segments = (res?.data?.wheel ?? []).map((item) => ({
      code:     item.code,
      color:    item.fillStyle,
      imageUrl: item.image,
      label:    item.text,
      prize:    parseFloat(item.amount) || 0,
      name:     item.name,
      types:    item.types,
    }));
  } catch {}

  return <SpinPage user={user} segments={segments} wheelEnabled={wheelEnabled} />;
}
