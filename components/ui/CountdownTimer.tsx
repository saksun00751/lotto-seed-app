"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface Parts {
  expired: boolean;
  hh: string;
  mm: string;
  ss: string;
}

function compute(closeAt: string): Parts {
  const diffMs = new Date(closeAt).getTime() - Date.now();
  if (diffMs <= 0) return { expired: true, hh: "00", mm: "00", ss: "00" };

  const totalSec = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins  = Math.floor((totalSec % 3600) / 60);
  const secs  = totalSec % 60;

  const p2 = (n: number) => String(n).padStart(2, "0");
  return { expired: false, hh: p2(hours), mm: p2(mins), ss: p2(secs) };
}

interface Props {
  closeAt:           string;   // ISO 8601 string
  className?:        string;
  showCurrentTime?:  boolean;
  expiredText?:      string;   // optional override text
  expiredClassName?: string;
}

export default function CountdownTimer({ closeAt, className = "", showCurrentTime, expiredText, expiredClassName }: Props) {
  const tc = useTranslation("countdown");
  const expiredLabel = expiredText ?? tc.expired;

  const [parts, setParts] = useState<Parts>(() => compute(closeAt));

  useEffect(() => {
    const tick = () => setParts(compute(closeAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [closeAt]);

  const activeClass = parts.expired && expiredClassName ? expiredClassName : className;

  const renderBlocks = () => (
    <div className="inline-flex items-center gap-1 text-[18px]">
      {[parts.hh, parts.mm, parts.ss].map((v, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="inline-flex items-center justify-center min-w-[30px] px-1.5 py-0.5 rounded-md bg-ap-bg border border-ap-border tabular-nums">
            {v}
          </span>
          {i < 2 && <span className="text-ap-tertiary">:</span>}
        </span>
      ))}
    </div>
  );

  if (parts.expired) {
    return <span className={activeClass}>{expiredLabel}</span>;
  }

  if (showCurrentTime) {
    return (
      <div className="text-center">
        <span className={activeClass}>{renderBlocks()}</span>
        <div className="text-[14px] text-ap-tertiary mt-1">{tc.hms}</div>
      </div>
    );
  }

  return <span className={activeClass}>{renderBlocks()}</span>;
}
