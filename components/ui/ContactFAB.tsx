"use client";

import { useState } from "react";

export default function ContactFAB() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">

      {/* Sub buttons */}
      {open && (
        <>
          {/* Line */}
          <a
            href="https://line.me/ti/p/~@1168lot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-white rounded-full pl-3 pr-4 py-2.5 shadow-card-xl border border-ap-border hover:scale-105 transition-transform animate-fade-up"
            style={{ animationDelay: "0.05s" }}
          >
            <div className="w-8 h-8 rounded-full bg-[#06C755] flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.02 2 11c0 3.07 1.6 5.78 4.08 7.5L5 21l3.13-1.56C9.32 19.78 10.63 20 12 20c5.52 0 10-4.02 10-9S17.52 2 12 2zm1 13H7v-1.5h6V15zm2-3H7v-1.5h8V12zm0-3H7V7.5h8V9z"/>
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-ap-primary whitespace-nowrap">Line</span>
          </a>

          {/* Telegram */}
          <a
            href="https://t.me/1168lot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-white rounded-full pl-3 pr-4 py-2.5 shadow-card-xl border border-ap-border hover:scale-105 transition-transform animate-fade-up"
          >
            <div className="w-8 h-8 rounded-full bg-[#2AABEE] flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-ap-primary whitespace-nowrap">Telegram</span>
          </a>
        </>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-13 h-13 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95",
          open
            ? "bg-ap-secondary rotate-45"
            : "bg-ap-blue hover:bg-ap-blue-h",
        ].join(" ")}
        style={{ width: 52, height: 52 }}
        aria-label="ติดต่อเรา"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

    </div>
  );
}
