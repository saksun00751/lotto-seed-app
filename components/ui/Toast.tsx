"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  message: string;
  type?:   "error" | "success" | "warning";
  durationMs?: number;
  onClose: () => void;
}

export default function Toast({ message, type = "error", durationMs = 3500, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // mount animation
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, durationMs);
    return () => clearTimeout(t);
  }, [durationMs, onClose]);

  const styles = {
    error:   "bg-ap-red   text-white",
    success: "bg-ap-green text-white",
    warning: "bg-yellow-500 text-white",
  };

  const icons = { error: "✕", success: "✓", warning: "⚠" };

  return createPortal(
    <div className="fixed top-5 left-1/2 z-[999] -translate-x-1/2 pointer-events-none">
      <div className={[
        "flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-card-xl min-w-[280px] max-w-[90vw] transition-all duration-300",
        styles[type],
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3",
      ].join(" ")}>
        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[13px] font-black shrink-0">
          {icons[type]}
        </span>
        <p className="text-[14px] font-semibold leading-snug">{message}</p>
      </div>
    </div>,
    document.body
  );
}
