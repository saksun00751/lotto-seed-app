import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/NavbarServer";
import { requireAuth } from "@/lib/session/auth";
import { getGameTypeMeta } from "@/lib/db/games";
import { prisma } from "@/lib/db/prisma";

interface Props {
  params: Promise<{ type: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `${id.toUpperCase()} — Lotto` };
}

export default async function GameDetailPage({ params }: Props) {
  const { type, id } = await params;
  const gameType = type.toUpperCase();
  const gameId   = id.toUpperCase();
  const meta     = getGameTypeMeta(gameType);

  const [user, game] = await Promise.all([
    requireAuth(),
    prisma.games_seamless.findFirst({
      where:  { id: gameId, game_type: gameType },
      select: { code: true, id: true, game_type: true, name: true, filepic: true, icon: true },
    }),
  ]);

  const phone = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Navbar balance={user.balance} diamond={user.diamond} userName={user.displayName ?? undefined} userPhone={phone} />

      <div className="max-w-lg mx-auto px-5 pt-5">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5 text-[13px]">
          <Link href="/dashboard" className="text-ap-secondary hover:text-ap-primary transition-colors">หน้าแรก</Link>
          <span className="text-ap-tertiary">/</span>
          <Link href={`/games/${type}`} className="text-ap-secondary hover:text-ap-primary transition-colors">{meta.emoji} {meta.label}</Link>
          <span className="text-ap-tertiary">/</span>
          <span className="text-ap-primary font-semibold">{game?.name || gameId}</span>
        </div>

        {game ? (
          <div className="bg-white rounded-3xl border border-ap-border shadow-card overflow-hidden">
            {/* Game image */}
            <div className="relative w-full aspect-[16/9] bg-ap-bg">
              <Image
                src={`/game_img/${game.filepic}`}
                alt={game.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="p-5 space-y-4">
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-ap-border flex-shrink-0">
                  <img src={`/icon_img/${game.icon}`} alt={game.id} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-[18px] font-bold text-ap-primary leading-tight">{game.name}</h1>
                  <p className="text-[12px] text-ap-secondary mt-0.5">{meta.emoji} {meta.label} · {game.id}</p>
                </div>
              </div>

              {/* Play button */}
              <button className="w-full py-3.5 rounded-2xl bg-ap-blue text-white text-[15px] font-bold hover:bg-ap-blue-h active:scale-[0.98] transition-all shadow-md">
                เข้าเล่น
              </button>

              <Link
                href={`/games/${type}`}
                className="block w-full py-3 rounded-2xl border-2 border-ap-border text-[14px] font-semibold text-ap-secondary text-center hover:bg-ap-bg transition-colors"
              >
                ← ดูเกมอื่นใน{meta.label}
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-ap-border shadow-card py-16 flex flex-col items-center gap-2">
            <span className="text-[48px]">🎮</span>
            <p className="text-[13px] text-ap-tertiary">ไม่พบเกมนี้</p>
            <Link href={`/games/${type}`} className="mt-2 text-[13px] text-ap-blue font-semibold">
              ← กลับ
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
