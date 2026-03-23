"use client";

export default function LastUpdated() {
  const now = new Date();
  const date = now.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return (
    <span className="text-white/60 text-[14px]" suppressHydrationWarning>
      ข้อมูลอัพเดทเมื่อ {date} {time}
    </span>
  );
}
