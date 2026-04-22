import type { Metadata } from "next";
import Link from "next/link";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import { getGameTypeMeta } from "@/lib/api/games";
import { apiGet } from "@/lib/api/client";
import { getTranslation } from "@/lib/i18n/getTranslation";
import GameGrid from "@/components/games/GameGrid";
import { withTitleSuffix } from "@/lib/i18n/metaTitle";

interface ApiGame {
  id:           string;
  provider:     string;
  gameName:     string;
  gameCategory: string;
  gameType:     string[];
  image:        { vertical: string; horizontal: string; banner: string };
  loginURL:     string;
  status:       string;
}

interface Props {
  params: Promise<{ locale: string; type: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id, type } = await params;
  const meta = getGameTypeMeta(type);
  const tBet = getTranslation(locale, "bet");
  const typeKey = type.toUpperCase() as keyof typeof tBet;
  const typeLabel = (tBet[typeKey] as string | undefined) ?? meta.label;
  return { title: await withTitleSuffix(`${id.toUpperCase()} — ${typeLabel}`) };
}

export default async function GameProviderGamesPage({ params }: Props) {
  const { locale, type, id } = await params;
  const meta = getGameTypeMeta(type);

  const [apiToken, lang] = await Promise.all([
    getApiToken(),
    getLangCookie(),
  ]);

  const token = apiToken ?? undefined;
  const t    = getTranslation(lang, "games");
  const tBet = getTranslation(lang, "bet");
  const typeKey = type.toUpperCase() as keyof typeof tBet;
  const typeLabel = (tBet[typeKey] as string | undefined) ?? meta.label;

  let games: ApiGame[] = [];
  try {
    const res = await apiGet<{ success: boolean; data?: ApiGame[] }>(
      `/games/${type}/${id}`,
      token,
      lang
    );
    games = res?.data ?? [];
  } catch {}

  const activeGames = games.filter((g) => g.status === "ACTIVE");

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <div className="max-w-5xl mx-auto px-4 pt-5">

        <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-ap-border">
            <Link
              href={`/${locale}/games/${type}`}
              className="w-8 h-8 rounded-full bg-ap-bg border border-ap-border flex items-center justify-center text-ap-secondary hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <div>
              <p className="text-[11px] text-ap-secondary font-medium">{meta.emoji} {typeLabel}</p>
              <h1 className="text-[16px] font-bold text-ap-primary leading-tight">
                {id.toUpperCase()}
              </h1>
              <p className="text-[12px] text-ap-secondary">
                {activeGames.length} {t.gameCount}
              </p>
            </div>
          </div>

          {/* Games grid */}
          <GameGrid
            games={activeGames}
            emoji={meta.emoji}
            notFound={t.notFound}
          />
        </div>

      </div>
    </div>
  );
}
