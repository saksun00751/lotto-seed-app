import type { Metadata } from "next";
import Image from "next/image";
import Navbar from "@/components/layout/NavbarServer";
import { requireAuth } from "@/lib/session/auth";
import { getPromotions } from "@/lib/db/promotions";
import type { PromotionRow } from "@/lib/db/promotions";

export const metadata: Metadata = { title: "โปรโมชั่น — Lotto" };

function PromoCard({ promo }: { promo: PromotionRow }) {
  const hasImage   = !!promo.filepic;
  const hasBonus   = promo.bonus_percent > 0 || promo.bonus_max > 0;
  const isActive   = promo.active === "Y";

  return (
    <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">

      {/* Image */}
      {hasImage ? (
        <div className="relative w-full aspect-[16/7] bg-ap-bg">
          <Image
            src={`https://service.1168lot.com/storage/promotion_img/${promo.filepic}`}
            alt={promo.name_th}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-full aspect-[16/7] bg-gradient-to-br from-ap-blue to-blue-400 flex items-center justify-center">
          <span className="text-[40px]">🎁</span>
        </div>
      )}

      <div className="p-4 space-y-3">

        {/* Title + badge */}
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-[15px] font-bold text-ap-primary leading-tight flex-1">{promo.name_th}</h2>
          {isActive && (
            <span className="shrink-0 text-[10px] font-bold text-white bg-ap-green rounded-full px-2.5 py-0.5">
              กำลังใช้งาน
            </span>
          )}
        </div>

        {/* Stats */}
        {hasBonus && (
          <div className="grid grid-cols-3 gap-2">
            {promo.bonus_percent > 0 && (
              <div className="bg-ap-bg rounded-xl px-3 py-2 text-center">
                <p className="text-[18px] font-extrabold text-ap-blue tabular-nums">{promo.bonus_percent}%</p>
                <p className="text-[10px] text-ap-tertiary mt-0.5">โบนัส</p>
              </div>
            )}
            {promo.bonus_max > 0 && (
              <div className="bg-ap-bg rounded-xl px-3 py-2 text-center">
                <p className="text-[15px] font-bold text-ap-primary tabular-nums">
                  ฿{promo.bonus_max.toLocaleString("th-TH")}
                </p>
                <p className="text-[10px] text-ap-tertiary mt-0.5">สูงสุด</p>
              </div>
            )}
            {promo.turnpro > 0 && (
              <div className="bg-ap-bg rounded-xl px-3 py-2 text-center">
                <p className="text-[15px] font-bold text-ap-primary tabular-nums">{promo.turnpro}x</p>
                <p className="text-[10px] text-ap-tertiary mt-0.5">เทิร์น</p>
              </div>
            )}
          </div>
        )}

        {/* Content (HTML) */}
        {promo.content && (
          <div
            className="text-[12px] text-ap-secondary leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: promo.content }}
          />
        )}

      </div>
    </div>
  );
}

export default async function PromotionPage() {
  const [user, promotions] = await Promise.all([
    requireAuth(),
    getPromotions(),
  ]);
  const phone = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Navbar balance={user.balance} diamond={user.diamond} userName={user.displayName ?? undefined} userPhone={phone} />

      <div className="max-w-2xl mx-auto px-5 pt-6 space-y-5">

        <div>
          <h1 className="text-[22px] font-bold text-ap-primary tracking-tight">โปรโมชั่น</h1>
          <p className="text-[13px] text-ap-secondary mt-0.5">{promotions.length} โปรโมชั่น</p>
        </div>

        {promotions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-ap-border shadow-card py-14 flex flex-col items-center gap-2">
            <span className="text-[48px]">🎁</span>
            <p className="text-[13px] text-ap-tertiary">ยังไม่มีโปรโมชั่น</p>
          </div>
        ) : (
          promotions.map((promo) => (
            <PromoCard key={promo.code} promo={promo} />
          ))
        )}

      </div>
    </div>
  );
}
