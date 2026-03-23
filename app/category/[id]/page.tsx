import Link from "next/link";
import CountdownTimer from "@/components/ui/CountdownTimer";
import BetLinkButton from "@/components/bet/BetLinkButton";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/NavbarServer";
import { requireAuth } from "@/lib/session/auth";
import { getLotteryCategory } from "@/lib/db/lottery";
import type { Metadata } from "next";
import type { SubItem } from "@/lib/categories";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cat = await getLotteryCategory(id);
  return { title: cat ? `${cat.label} — Lotto` : "ไม่พบหน้า" };
}

// ─── Sub-item card ──────────────────────────────────────────────────────────────
function SubItemCard({ item }: { item: SubItem }) {
  return (
    <div className="bg-white rounded-2xl border border-ap-border shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5 overflow-hidden">
      <div className={`h-[3px] bg-gradient-to-r ${item.barClass}`} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[24px]">{item.flag}</span>
            <div>
              <div className="text-[13px] font-semibold text-ap-primary leading-tight">{item.name}</div>
              <div className="text-[11px] text-ap-tertiary mt-0.5">{item.sub}</div>
            </div>
          </div>
          {item.isOpen ? (
            <span className="flex items-center gap-1 text-[10px] font-medium text-ap-red bg-ap-red/8 px-2 py-0.5 rounded-full border border-ap-red/15 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-ap-red animate-pulse inline-block" />
              Live
            </span>
          ) : (
            <span className="text-[10px] font-medium text-ap-green bg-ap-green/8 px-2 py-0.5 rounded-full border border-ap-green/15 flex-shrink-0">
              ✓ ออกแล้ว
            </span>
          )}
        </div>

        {/* Result or countdown */}
        {item.result ? (
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <div className="bg-ap-bg rounded-xl p-2 text-center">
              <div className="text-[20px] font-bold text-ap-primary tabular-nums">{item.result.top3}</div>
              <div className="text-[10px] text-ap-tertiary">3 ตัวบน</div>
            </div>
            <div className="bg-ap-bg rounded-xl p-2 text-center">
              <div className="text-[20px] font-bold text-ap-primary tabular-nums">{item.result.bot2}</div>
              <div className="text-[10px] text-ap-tertiary">2 ตัวล่าง</div>
            </div>
          </div>
        ) : (
          <div className="text-center h-[52px] flex flex-col items-center justify-center mb-3">
            {item.closeAt
              ? <CountdownTimer closeAt={item.closeAt} className="text-[22px] font-bold text-ap-primary tabular-nums tracking-wide" showCurrentTime expiredText="—" />
              : <span className="text-[22px] font-bold text-ap-primary tabular-nums tracking-wide">{item.countdown ?? "—"}</span>
            }
          </div>
        )}

        {/* Action */}
        {item.isOpen ? (
          <BetLinkButton href={item.href} closeAt={item.closeAt} />
        ) : (
          <button className="block w-full text-center bg-ap-bg border border-ap-border text-ap-secondary rounded-full py-2 text-[12px] font-medium cursor-default">
            ดูผลย้อนหลัง
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Coming soon ────────────────────────────────────────────────────────────────
function ComingSoon({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-[64px] mb-4">{emoji}</div>
      <h2 className="text-[20px] font-bold text-ap-primary mb-2">{label}</h2>
      <p className="text-[14px] text-ap-tertiary">เปิดให้บริการเร็วๆ นี้</p>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default async function CategoryPage({ params }: Props) {
  const { id } = await params;
  const [cat, user] = await Promise.all([getLotteryCategory(id), requireAuth()]);
  if (!cat) notFound();
  const phone = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  const openCount = cat.items.filter((i) => i.isOpen).length;

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Navbar balance={user.balance} diamond={user.diamond} userName={user.displayName ?? undefined} userPhone={phone} />
      <div className="max-w-5xl mx-auto px-5 pt-6">

        {/* Back + header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/dashboard"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-ap-border text-ap-secondary hover:bg-ap-bg transition-colors text-[18px]"
          >
            ←
          </Link>
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-[20px] shadow-sm`}
          >
            {cat.emoji}
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-ap-primary leading-tight">{cat.label}</h1>
            {openCount > 0 ? (
              <p className="text-[12px] text-ap-red font-medium">🔴 {openCount} รายการ Live</p>
            ) : (
              <p className="text-[12px] text-ap-tertiary">{cat.items.length} รายการ</p>
            )}
          </div>
        </div>

        {/* Items or coming soon */}
        {cat.items.length === 0 ? (
          <ComingSoon emoji={cat.emoji} label={cat.label} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {cat.items.map((item) => (
              <SubItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
