"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

export default function LastUpdated() {
  const t = useTranslation("dashboard");
  const now = new Date();
  const date = now.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return (
    <span className="text-ui-balance-muted text-[14px] font-semibold [text-shadow:0_1px_2px_rgba(0,0,0,0.24)]" suppressHydrationWarning>
      {t.lastUpdated} {date} {time}
    </span>
  );
}
