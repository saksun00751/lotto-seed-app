"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HScrollRow from "@/components/ui/HScrollRow";

export interface ActivePromotion {
  select: boolean;
  name: string;
  min: string;
}

interface PromotionItem {
  code: number;
  id?: string;
  name_th: string;
  filepic: string;
  sort?: number;
  bonus_percent?: string;
  bonus_max?: string;
  amount_min?: string;
}

interface PromotionApiPayload {
  success?: boolean;
  message?: string;
  data?: { promotions?: PromotionItem[]; getpro?: boolean };
}

interface PromotionActionResponse {
  success?: boolean;
  message?: string;
}

const PROMO_ID_LABELS: Record<string, string> = {
  pro_cashback: "โปรโมชั่น Cashback",
  pro_ic: "โปรโมชั่น IC",
  pro_faststart: "โปรโมชั่น Fast Start",
  pro_spin: "โปรโมชั่น Spin",
  pro_coupon: "โปรโมชั่น Coupon",
};

const HIDE_PROMO_BUTTON_IDS = new Set([
  "pro_cashback",
  "pro_ic",
  "pro_faststart",
  "pro_spin",
  "pro_coupon",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "1" || v === "true" || v === "y" || v === "yes";
  }
  return false;
}

function extractSelectedPromotion(payload: unknown): ActivePromotion | null {
  const root = asRecord(payload);
  if (!root) return null;
  const data = asRecord(root.data);
  const profile = asRecord(root.profile);
  const candidates = [root.promotion, data?.promotion, profile?.promotion];
  for (const candidate of candidates) {
    const rec = asRecord(candidate);
    if (!rec) continue;
    if (!toBool(rec.select)) continue;
    const name = typeof rec.name === "string" ? rec.name.trim() : "";
    const minRaw = rec.min;
    const min =
      typeof minRaw === "string" ? minRaw.trim()
      : typeof minRaw === "number" ? String(minRaw)
      : "0";
    return { select: true, name: name || "โปรโมชั่นที่เลือก", min: min || "0" };
  }
  return null;
}

function promoDisplayName(raw: string): string {
  const text = raw.trim();
  const key = text.toLowerCase();
  if (PROMO_ID_LABELS[key]) return PROMO_ID_LABELS[key];
  if (key.startsWith("pro_")) return "โปรโมชั่นพิเศษ";
  return text || "โปรโมชั่นพิเศษ";
}

interface Props {
  lang: string;
  initialActive: ActivePromotion | null;
  onNotify: (message: string, type: "success" | "error") => void;
  onActiveChange?: (active: ActivePromotion | null) => void;
}

export default function PromotionPanel({ lang, initialActive, onNotify, onActiveChange }: Props) {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [promotionLoading, setPromotionLoading] = useState(true);
  const [promoSubmittingId, setPromoSubmittingId] = useState<string | null>(null);
  const [promoDeselecting, setPromoDeselecting] = useState(false);
  const [activePromotion, setActivePromotion] = useState<ActivePromotion | null>(initialActive);

  useEffect(() => {
    setActivePromotion(initialActive);
  }, [initialActive]);

  useEffect(() => {
    fetch("/api/promotion/list")
      .then((r) => r.json())
      .then((res: PromotionApiPayload) => {
        const list = Array.isArray(res.data?.promotions) ? res.data.promotions : [];
        const sorted = list
          .filter((p) => p && typeof p.name_th === "string" && p.name_th.trim())
          .sort((a, b) => (a.sort ?? 9999) - (b.sort ?? 9999));
        setPromotions(sorted);
      })
      .catch(() => setPromotions([]))
      .finally(() => setPromotionLoading(false));
  }, []);

  const visiblePromotions = promotions.filter((promo) => {
    const promoId = (promo.id ?? "").trim().toLowerCase();
    return !HIDE_PROMO_BUTTON_IDS.has(promoId);
  });

  function updateActive(next: ActivePromotion | null) {
    setActivePromotion(next);
    onActiveChange?.(next);
  }

  async function refreshActivePromotion() {
    try {
      const res = await fetch("/api/member/loadbalance", { method: "GET" });
      let payload: unknown = null;
      try { payload = await res.json(); } catch {}
      if (!res.ok) return;
      updateActive(extractSelectedPromotion(payload));
    } catch {}
  }

  async function handleSelectPromotion(promotionCode: string) {
    const code = promotionCode.trim();
    if (!code) return;
    setPromoSubmittingId(code);
    try {
      const res = await fetch("/api/promotion/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promotion: code }),
      });
      let payload: PromotionActionResponse = {};
      try { payload = await res.json(); } catch {}
      const ok = Boolean(res.ok && payload.success);
      const message = payload.message?.trim() || (ok ? "รับโปรโมชั่นสำเร็จ" : "ไม่สามารถรับโปรโมชั่นได้");
      if (!ok) {
        onNotify(message, "error");
        return;
      }
      await refreshActivePromotion();
      onNotify(message, "success");
    } catch {
      onNotify("ไม่สามารถเชื่อมต่อระบบได้", "error");
    } finally {
      setPromoSubmittingId(null);
    }
  }

  async function handleDeselectPromotion() {
    setPromoDeselecting(true);
    try {
      const res = await fetch("/api/promotion/deselect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      let payload: PromotionActionResponse = {};
      try { payload = await res.json(); } catch {}
      const ok = Boolean(res.ok && payload.success);
      const message = payload.message?.trim() || (ok ? "ยกเลิกโปรโมชั่นสำเร็จ" : "ไม่สามารถยกเลิกโปรโมชั่นได้");
      if (!ok) {
        onNotify(message, "error");
        return;
      }
      await refreshActivePromotion();
      onNotify(message, "success");
    } catch {
      onNotify("ไม่สามารถเชื่อมต่อระบบได้", "error");
    } finally {
      setPromoDeselecting(false);
    }
  }

  return (
    <>
      {(promotionLoading || visiblePromotions.length > 0) && (
        <div className="relative bg-[linear-gradient(165deg,#ffffff_0%,#f9fbff_100%)] rounded-2xl border border-slate-200 shadow-[0_14px_30px_rgba(15,23,42,0.10)] px-5 py-4 mb-5">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-200/70 to-transparent" />
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[14px] text-ap-tertiary uppercase tracking-wide font-medium">รายการโปรโมชั่น</p>
            <Link href={`/${lang}/promotion`} className="text-[12px] font-semibold text-ap-blue hover:text-ap-blue-h transition-colors">
              ดูทั้งหมด
            </Link>
          </div>

          {promotionLoading ? (
            <div className="space-y-2">
              <div className="h-16 rounded-xl bg-ap-bg animate-pulse" />
              <div className="h-16 rounded-xl bg-ap-bg animate-pulse" />
            </div>
          ) : (
            <HScrollRow itemWidth={248} scrollBy={1}>
              {visiblePromotions.slice(0, 4).map((promo) => {
                const bonusPercent = Number(promo.bonus_percent) || 0;
                const minDeposit = Number(promo.amount_min) || 0;
                const title = promoDisplayName(promo.name_th);
                const promoCode = String(promo.code ?? "");
                return (
                  <div
                    key={promo.code}
                    className="min-w-[236px] sm:min-w-[248px] snap-start rounded-xl border border-slate-200 bg-white overflow-hidden shadow-[0_8px_18px_rgba(15,23,42,0.08)] hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition-shadow"
                  >
                    {promo.filepic ? (
                      <img src={promo.filepic} alt={title} className="w-full h-32 sm:h-36 object-cover" />
                    ) : (
                      <div className="w-full h-32 sm:h-36 bg-ap-bg flex items-center justify-center text-[36px]">🎁</div>
                    )}
                    <div className="p-3 flex flex-col">
                      <p className="text-[14px] font-semibold text-ap-primary leading-snug">{title}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {bonusPercent > 0 && (
                          <span className="text-[11px] font-bold text-ap-blue bg-ap-blue/10 rounded-full px-2 py-0.5">
                            โบนัส {bonusPercent}%
                          </span>
                        )}
                        {minDeposit > 0 && (
                          <span className="text-[11px] text-ap-tertiary">
                            ขั้นต่ำ ฿{minDeposit.toLocaleString("en-US")}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => { void handleSelectPromotion(promoCode); }}
                          disabled={!promoCode || promoSubmittingId === promoCode || promoDeselecting}
                          className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-ap-blue text-white text-[12px] font-semibold hover:bg-ap-blue-h transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {promoSubmittingId === promoCode ? "กำลังรับ..." : "รับโปร"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </HScrollRow>
          )}
        </div>
      )}

      {activePromotion && (
        <div className="relative bg-[linear-gradient(165deg,#ffffff_0%,#f9fbff_100%)] rounded-2xl border border-slate-200 shadow-[0_14px_30px_rgba(15,23,42,0.10)] px-5 py-4 mb-5">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-200/70 to-transparent" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] text-ap-tertiary uppercase tracking-wide font-medium mb-1">โปรโมชั่นที่รับอยู่</p>
              <p className="text-[15px] font-semibold text-ap-primary leading-snug">{activePromotion.name}</p>
              <p className="text-[13px] text-ap-secondary mt-1">
                ยอดขั้นต่ำ ฿{(Number(activePromotion.min) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { void handleDeselectPromotion(); }}
              disabled={promoDeselecting || !!promoSubmittingId}
              className="px-3 py-2 rounded-full border border-ap-red/30 bg-red-50 text-red-600 text-[12px] font-semibold hover:bg-red-100 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {promoDeselecting ? "กำลังยกเลิก..." : "ยกเลิกโปร"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
