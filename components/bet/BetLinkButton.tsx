"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/ui/Toast";

interface Props {
  href:     string;
  closeAt?: string;   // ISO 8601 string
}

export default function BetLinkButton({ href, closeAt }: Props) {
  const router = useRouter();
  const [toast,   setToast]   = useState(false);
  const [expired, setExpired] = useState(false);

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
      <div className="block w-full text-center bg-ap-red/10 border border-ap-red/20 text-ap-red rounded-full py-2 text-[12px] font-semibold">
        ปิดรับ
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
        className="block w-full text-center bg-ap-blue text-white rounded-full py-2 text-[12px] font-semibold hover:bg-ap-blue-h transition-colors active:scale-95"
      >
        แทงหวย →
      </button>

      {toast && (
        <Toast
          message="หวยปิดรับแล้ว กำลังรีเฟรชข้อมูล..."
          type="warning"
          onClose={() => setToast(false)}
        />
      )}
    </>
  );
}
