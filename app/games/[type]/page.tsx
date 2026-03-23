import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/NavbarServer";
import { requireAuth } from "@/lib/session/auth";
import { getGamesByType, getGameTypeMeta } from "@/lib/db/games";

interface Props {
  params: Promise<{ type: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const meta = getGameTypeMeta(type.toUpperCase());
  return { title: `${meta.label} — Lotto` };
}

export default async function GamesTypePage({ params }: Props) {
  const { type } = await params;
  const gameType = type.toUpperCase();
  const meta     = getGameTypeMeta(gameType);

  const [user, games] = await Promise.all([
    requireAuth(),
    getGamesByType(gameType),
  ]);
  const phone = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Navbar balance={user.balance} diamond={user.diamond} userName={user.displayName ?? undefined} userPhone={phone} />

      <div className="max-w-5xl mx-auto px-4 pt-5">

        {/* Grid */}
        <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
          {/* Card header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-ap-border">
            <Link href="/bet"
              className="w-8 h-8 rounded-full bg-ap-bg border border-ap-border flex items-center justify-center text-ap-secondary hover:bg-gray-200 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <div>
              <h1 className="text-[16px] font-bold text-ap-primary leading-tight">{meta.emoji} {meta.label}</h1>
              <p className="text-[12px] text-ap-secondary">{games.length} เกม</p>
            </div>
          </div>
          {games.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2">
              <span className="text-[48px]">{meta.emoji}</span>
              <p className="text-[13px] text-ap-tertiary">ยังไม่มีเกม</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 p-3">
              {games.map((g) => (
                <Link
                  key={g.code}
                  href={`/games/${type}/${g.id.toLowerCase()}`}
                  className="group flex flex-col items-center gap-2 text-center active:scale-[0.97] transition-all"
                >
                  <div className="w-full aspect-[3/5] rounded-2xl overflow-hidden flex items-center justify-center">
                    <img
                      src={`/game_img/${g.filepic}`}
                      alt={g.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-[11px] font-semibold text-ap-primary leading-tight line-clamp-2 w-full">{g.id}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
