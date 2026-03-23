"use client";

import { useEffect, useState } from "react";


function format(closeAt: string, expiredText: string): string {
  const diffMs = new Date(closeAt).getTime() - Date.now();
  if (diffMs <= 0) return expiredText;

  const totalSec = Math.floor(diffMs / 1000);
  const days  = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins  = Math.floor((totalSec % 3600) / 60);
  const secs  = totalSec % 60;

  if (days > 0) {
    const closeDate = new Date(closeAt).toLocaleString("th-TH", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${days} วัน (${closeDate})`;
  }
  return [hours, mins, secs].map((n) => String(n).padStart(2, "0")).join(":");
}

interface Props {
  closeAt:           string;   // ISO 8601 string
  className?:        string;
  showCurrentTime?:  boolean;
  expiredText?:      string;
  expiredClassName?: string;
}

export default function CountdownTimer({ closeAt, className = "", showCurrentTime, expiredText = "ปิดรับแล้ว", expiredClassName }: Props) {
  const [display,   setDisplay]  = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const expired = new Date(closeAt).getTime() <= Date.now();
      setIsExpired(expired);
      setDisplay(format(closeAt, expiredText));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [closeAt, expiredText]);

  const activeClass = isExpired && expiredClassName ? expiredClassName : className;

  if (showCurrentTime) {
    return (
      <div className="text-center">
        <span className={activeClass}>{display}</span>
        {!isExpired && <div className="text-[10px] text-ap-tertiary mt-0.5">ชม. · นาที · วินาที</div>}
      </div>
    );
  }

  return <span className={activeClass}>{display}</span>;
}
