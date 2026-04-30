"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/ui/Toast";

interface Props {
  href:     string;
  closeAt?: string;   // ISO 8601 string
  labelPlay?: string;
  labelClosed?: string;
  toastClosedRefresh?: string;
}

export default function BetLinkButton({
  href,
  closeAt,
  labelPlay = "แทงหวย →",
  labelClosed = "ปิดรับ",
  toastClosedRefresh = "หวยปิดรับแล้ว กำลังรีเฟรชข้อมูล...",
}: Props) {
  const router = useRouter();
  const [toast,   setToast]   = useState(false);
  const [expired, setExpired] = useState(false);
  const playLabel = labelPlay.replace(/\s*→\s*$/g, "").replace(/\s+/g, " ").trim();

  useEffect(() => {
    if (!closeAt) return;
    const check = () => {
      if (new Date(closeAt).getTime() <= Date.now()) setExpired(true);
    };
    check();
    const diff = new Date(closeAt).getTime() - Date.now();
    if (diff <= 0) return;
    const id = setTimeout(() => setExpired(true), diff);
    return () => clearTimeout(id);
  }, [closeAt]);

  if (expired) {
    return (
      <div className="block w-full text-center bg-ap-red/10 border border-ap-red/20 text-ap-red rounded-full py-2 text-[14px] font-semibold">
        {labelClosed}
      </div>
    );
  }

  function handleClick() {
    if (closeAt && new Date(closeAt).getTime() <= Date.now()) {
      setToast(true);
      router.refresh();
      return;
    }
    router.push(href);
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap bg-ap-blue text-white rounded-full py-2 text-[14px] font-semibold hover:bg-ap-blue-h transition-colors active:scale-95"
      >
        <span className="leading-none">{playLabel}</span>
        <svg className="w-3.5 h-3.5 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </button>

      {toast && (
        <Toast
          message={toastClosedRefresh}
          type="warning"
          onClose={() => setToast(false)}
        />
      )}
    </>
  );
}
