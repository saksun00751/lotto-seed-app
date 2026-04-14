"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

interface ApiPromotion {
  code: number;
  id?: string;
  name_th: string;
  filepic: string;
  sort?: number;
  bonus_percent: string;
  bonus_max: string;
  turnpro: string;
  content: string;
  amount_min: string;
}

interface PromotionActionResponse {
  success?: boolean;
  message?: string;
}

interface ActivePromotion {
  select: boolean;
  name: string;
  min: string;
}

interface Props {
  promotions: ApiPromotion[];
  selectedPromotion?: ActivePromotion | null;
}

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
    if (!rec || !toBool(rec.select)) continue;
    const name = typeof rec.name === "string" ? rec.name.trim() : "";
    const minRaw = rec.min;
    const min =
      typeof minRaw === "string" ? minRaw.trim()
      : typeof minRaw === "number" ? String(minRaw)
      : "0";
    return {
      select: true,
      name: name || "โปรโมชั่นที่เลือก",
      min: min || "0",
    };
  }

  return null;
}

function PromoCard({
  promo,
  pending,
  disabledAll,
  hideButton,
  onSelect,
}: {
  promo: ApiPromotion;
  pending: boolean;
  disabledAll: boolean;
  hideButton: boolean;
  onSelect: (code: string) => Promise<void>;
}) {
  const bonusPercent = parseFloat(promo.bonus_percent) || 0;
  const bonusMax = parseFloat(promo.bonus_max) || 0;
  const turnpro = parseFloat(promo.turnpro) || 0;
  const minDeposit = Number(promo.amount_min) || 0;
  const hasBonus = bonusPercent > 0 || bonusMax > 0;
  const promoCode = String(promo.code ?? "");

  return (
    <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
      {promo.filepic ? (
        <div className="relative w-full aspect-[16/7] bg-ap-bg">
          <img
            src={promo.filepic}
            alt={promo.name_th}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full aspect-[16/7] bg-gradient-to-br from-ap-blue to-blue-400 flex items-center justify-center">
          <span className="text-[40px]">🎁</span>
        </div>
      )}

      <div className="p-4 space-y-3">
        <h2 className="text-[15px] font-bold text-ap-primary leading-tight">{promo.name_th}</h2>

        {hasBonus && (
          <div className="grid grid-cols-3 gap-2">
            {bonusPercent > 0 && (
              <div className="bg-ap-bg rounded-xl px-3 py-2 text-center">
                <p className="text-[18px] font-extrabold text-ap-blue tabular-nums">{bonusPercent}%</p>
                <p className="text-[10px] text-ap-tertiary mt-0.5">โบนัส</p>
              </div>
            )}
            {bonusMax > 0 && (
              <div className="bg-ap-bg rounded-xl px-3 py-2 text-center">
                <p className="text-[15px] font-bold text-ap-primary tabular-nums">
                  ฿{bonusMax.toLocaleString("th-TH")}
                </p>
                <p className="text-[10px] text-ap-tertiary mt-0.5">สูงสุด</p>
              </div>
            )}
            {turnpro > 0 && (
              <div className="bg-ap-bg rounded-xl px-3 py-2 text-center">
                <p className="text-[15px] font-bold text-ap-primary tabular-nums">{turnpro}x</p>
                <p className="text-[10px] text-ap-tertiary mt-0.5">เทิร์น</p>
              </div>
            )}
          </div>
        )}

        {minDeposit > 0 && (
          <p className="text-[12px] text-ap-tertiary">
            ฝากขั้นต่ำ ฿{minDeposit.toLocaleString("en-US")}
          </p>
        )}

        {promo.content && (
          <div
            className="text-[12px] text-ap-secondary leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: promo.content }}
          />
        )}

        {!hideButton && (
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={() => { void onSelect(promoCode); }}
              disabled={!promoCode || pending || disabledAll}
              className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-ap-blue text-white text-[12px] font-semibold hover:bg-ap-blue-h transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? "กำลังรับ..." : "รับโปร"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PromotionPageClient({ promotions, selectedPromotion }: Props) {
  const [activePromotion, setActivePromotion] = useState<ActivePromotion | null>(
    selectedPromotion?.select ? selectedPromotion : null,
  );
  const [submittingCode, setSubmittingCode] = useState<string | null>(null);
  const [deselecting, setDeselecting] = useState(false);

  const sortedPromotions = useMemo(() => {
    return [...promotions].sort((a, b) => (a.sort ?? 9999) - (b.sort ?? 9999));
  }, [promotions]);

  async function refreshActivePromotion() {
    try {
      const res = await fetch("/api/member/loadbalance", { method: "GET" });
      let payload: unknown = null;
      try { payload = await res.json(); } catch {}
      if (!res.ok) return false;
      setActivePromotion(extractSelectedPromotion(payload));
      return true;
    } catch {
      return false;
    }
  }

  async function handleSelectPromotion(promotionCode: string) {
    const code = promotionCode.trim();
    if (!code) return;
    setSubmittingCode(code);
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
        toast.error(message);
        return;
      }
      await refreshActivePromotion();
      toast.success(message);
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อระบบได้");
    } finally {
      setSubmittingCode(null);
    }
  }

  async function handleDeselectPromotion() {
    setDeselecting(true);
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
        toast.error(message);
        return;
      }

      await refreshActivePromotion();
      toast.success(message);
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อระบบได้");
    } finally {
      setDeselecting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <div className="max-w-5xl mx-auto px-5 pt-6 space-y-5">
        <div>
          <h1 className="text-[22px] font-bold text-ap-primary tracking-tight">โปรโมชั่น</h1>
          <p className="text-[13px] text-ap-secondary mt-0.5">{sortedPromotions.length} โปรโมชั่น</p>
        </div>

        {sortedPromotions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-ap-border shadow-card py-14 flex flex-col items-center gap-2">
            <span className="text-[48px]">🎁</span>
            <p className="text-[13px] text-ap-tertiary">ยังไม่มีโปรโมชั่น</p>
          </div>
        ) : (
          sortedPromotions.map((promo) => (
            <PromoCard
              key={promo.code}
              promo={promo}
              pending={submittingCode === String(promo.code ?? "")}
              disabledAll={deselecting}
              hideButton={HIDE_PROMO_BUTTON_IDS.has((promo.id ?? "").trim().toLowerCase())}
              onSelect={handleSelectPromotion}
            />
          ))
        )}

        {activePromotion && (
          <div className="bg-white rounded-2xl border border-ap-border shadow-card px-5 py-4">
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
                disabled={deselecting || !!submittingCode}
                className="px-3 py-2 rounded-full border border-ap-red/30 bg-red-50 text-red-600 text-[12px] font-semibold hover:bg-red-100 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deselecting ? "กำลังยกเลิก..." : "ยกเลิกโปร"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
