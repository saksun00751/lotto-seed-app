"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RefreshButton() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  async function handleRefresh() {
    if (spinning) return;
    setSpinning(true);
    router.refresh();
    setTimeout(() => setSpinning(false), 800);
  }

  return (
    <button
      onClick={handleRefresh}
      className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow pointer-events-auto hover:bg-white transition-colors"
      title="รีเฟรช"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="#555"
        style={{
          transition: "transform 0.8s ease",
          transform: spinning ? "rotate(360deg)" : "rotate(0deg)",
        }}
      >
        <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
      </svg>
    </button>
  );
}
