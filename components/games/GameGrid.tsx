"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface Game {
  id:       string;
  provider: string;
  gameName: string;
  image:    { vertical: string };
}

interface Props {
  games:    Game[];
  emoji:    string;
  notFound: string;
}

export default function GameGrid({ games, emoji, notFound }: Props) {
  const t = useTranslation("games");
  const [loading, setLoading] = useState<string | null>(null);

  async function handlePlay(game: Game) {
    if (loading) return;
    setLoading(game.id);
    try {
      const res = await fetch("/api/games/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: game.provider, game: game.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        alert(data.error ?? t.errCannotPlay);
      }
    } catch {
      alert(t.errGeneric);
    } finally {
      setLoading(null);
    }
  }

  if (games.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-2">
        <span className="text-[48px]">{emoji}</span>
        <p className="text-[13px] text-ap-tertiary">{notFound}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 p-3">
      {games.map((g) => (
        <button
          key={g.id}
          onClick={() => handlePlay(g)}
          disabled={!!loading}
          className="group flex flex-col items-center gap-2 text-center active:scale-[0.97] transition-all disabled:opacity-60"
        >
          <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-ap-bg flex items-center justify-center relative">
            {g.image?.vertical ? (
              <img
                src={g.image.vertical}
                alt={g.gameName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <span className="text-[32px]">{emoji}</span>
            )}
            {loading === g.id && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                <svg className="w-6 h-6 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            )}
          </div>
          <p className="text-[11px] font-semibold text-ap-primary leading-tight line-clamp-2 w-full">
            {g.gameName}
          </p>
        </button>
      ))}
    </div>
  );
}
