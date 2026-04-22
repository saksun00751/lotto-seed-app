import type { Metadata } from "next";
import { LangProvider } from "@/lib/i18n/context";
import CouponPage, { type CouponItem } from "@/components/coupon/CouponPage";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { apiGet, apiPost, ApiError } from "@/lib/api/client";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: await getPageMetaTitle(locale, "coupon") };
}

interface CouponApiResponse {
  success?: boolean;
  message?: string;
  items?:   CouponItem[];
  summary?: { count?: number };
}

export default async function CouponRoute({ params }: Props) {
  const { locale } = await params;
  const [token, lang] = await Promise.all([getApiToken(), getLangCookie()]);

  let items: CouponItem[] = [];
  let count = 0;

  try {
    const res = await apiGet<CouponApiResponse>("/coupon/my", token ?? undefined, lang);
    items = res.items ?? [];
    count = res.summary?.count ?? items.length;
  } catch {}

  async function claimCoupon(code: string): Promise<{ success: boolean; message?: string }> {
    "use server";
    const [tk, lg] = await Promise.all([getApiToken(), getLangCookie()]);
    if (!tk) return { success: false, message: "กรุณาเข้าสู่ระบบ" };
    try {
      const res = await apiPost<{ success?: boolean; message?: string }>(
        `/coupon/my/${encodeURIComponent(code)}/claim`,
        {},
        tk,
        lg,
      );
      return { success: Boolean(res?.success), message: res?.message };
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "ไม่สามารถรับโบนัสได้";
      return { success: false, message: msg };
    }
  }

  async function redeemCoupon(code: string): Promise<{ success: boolean; message?: string }> {
    "use server";
    const [tk, lg] = await Promise.all([getApiToken(), getLangCookie()]);
    if (!tk) return { success: false, message: "กรุณาเข้าสู่ระบบ" };
    try {
      const res = await apiPost<{ success?: boolean; message?: string }>(
        "/member/coupon/redeem",
        { code },
        tk,
        lg,
      );
      return { success: Boolean(res?.success), message: res?.message };
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "ไม่สามารถใช้คูปองได้";
      return { success: false, message: msg };
    }
  }

  return (
    <LangProvider>
      <CouponPage
        items={items}
        count={count}
        locale={locale}
        onClaim={claimCoupon}
        onRedeem={redeemCoupon}
      />
    </LangProvider>
  );
}
