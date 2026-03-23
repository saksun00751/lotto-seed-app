"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import type { GameSeamlessRow } from "@/lib/db/games";

interface Props {
  games:    GameSeamlessRow[];
  gameType: string;
}

export default function GameGroupSlider({ games, gameType }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const idxRef   = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const n = games.length;
    idxRef.current = ((i % n) + n) % n;
    const item = el.children[idxRef.current] as HTMLElement | undefined;
    if (item) el.scrollTo({ left: item.offsetLeft, behavior: "smooth" });
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => scrollTo(idxRef.current + 1), 3500);
  };

  useEffect(() => {
    if (games.length <= 1) return;
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [games.length]);

  if (games.length === 0) return null;

  return (
    <div className="relative select-none">
      {/* Track — scrollable but scrollbar hidden */}
      <div
        ref={trackRef}
        className="flex gap-1.5 overflow-x-scroll [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {games.map((g) => (
          <Link
            key={g.code}
            href={`/games/${gameType}/${g.id.toLowerCase()}`}
            className="group flex-shrink-0 w-[96px] sm:w-[140px] flex flex-col items-center gap-2 text-center active:scale-[0.97] transition-all"
          >
            <div className="w-full aspect-[3/5] rounded-2xl overflow-hidden">
              <img
                src={`https://service.1168lot.com/storage/game_img/${g.filepic}`}
                alt={g.id}
                className="w-full h-full object-cover rounded-2xl group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <p className="text-[11px] font-semibold text-ap-primary leading-tight line-clamp-2 w-full">
              {g.id}
            </p>
          </Link>
        ))}
      </div>

      {/* Prev / Next */}
      {games.length > 5 && (
        <>
          <button
            onClick={() => { scrollTo(idxRef.current - 1); resetTimer(); }}
            className="absolute left-0 top-1/2 -translate-y-6 w-7 h-7 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => { scrollTo(idxRef.current + 1); resetTimer(); }}
            className="absolute right-0 top-1/2 -translate-y-6 w-7 h-7 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
