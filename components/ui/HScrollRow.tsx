"use client";
import { useRef, useState, useEffect, useCallback } from "react";

interface Props {
  children: React.ReactNode;
  itemWidth?: number;
  scrollBy?: number; // number of items per click
}

export default function HScrollRow({ children, itemWidth = 92, scrollBy = 3 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, [update]);

  const scroll = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * itemWidth * scrollBy, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Left button */}
      <button
        onClick={() => scroll(-1)}
        disabled={!canLeft}
        className={[
          "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-7 h-7 rounded-full bg-white border border-ap-border shadow-card flex items-center justify-center transition-all",
          canLeft ? "text-ap-secondary hover:bg-ap-bg active:scale-95" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Scroll container */}
      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
      >
        {children}
      </div>

      {/* Right button */}
      <button
        onClick={() => scroll(1)}
        disabled={!canRight}
        className={[
          "absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-7 h-7 rounded-full bg-white border border-ap-border shadow-card flex items-center justify-center transition-all",
          canRight ? "text-ap-secondary hover:bg-ap-bg active:scale-95" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
