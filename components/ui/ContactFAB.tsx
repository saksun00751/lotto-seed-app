"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getContactChannels } from "@/lib/api/contact-channels";

export default function ContactFAB() {
  const params = useParams();
  const locale = params.locale as string;
  const [hasChannels, setHasChannels] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const data = await getContactChannels(locale);
        setHasChannels(data.length > 0);
      } catch (err) {
        console.error("Failed to fetch contact channels:", err);
      }
    };

    fetchChannels();
  }, [locale]);

  if (!hasChannels || !isVisible) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        aria-label="Close"
        className="w-5 h-5 rounded-full bg-white/90 shadow flex items-center justify-center text-ap-tertiary hover:text-ap-primary active:scale-95 transition"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <Link
        href={`/${locale}/contact`}
        aria-label="Contact us"
        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all active:scale-95 text-white"
        style={{ backgroundColor: "#06C755" }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="white" aria-hidden="true">
          <path d="M12 3C6.48 3 2 6.58 2 11c0 2.63 1.6 4.96 4.06 6.44-.17.62-.62 2.23-.7 2.58-.11.45.16.44.34.32.14-.09 2.22-1.51 3.12-2.12.7.1 1.43.15 2.18.15 5.52 0 10-3.58 10-8S17.52 3 12 3zM8.06 13.03H6.3c-.2 0-.36-.16-.36-.36V9.34c0-.2.16-.36.36-.36s.36.16.36.36v2.97h1.4c.2 0 .36.16.36.36s-.16.36-.36.36zm1.66-.36c0 .2-.16.36-.36.36s-.36-.16-.36-.36V9.34c0-.2.16-.36.36-.36s.36.16.36.36v3.33zm4.01 0c0 .16-.1.29-.25.34-.04.01-.07.02-.11.02-.11 0-.22-.05-.29-.14l-1.68-2.29v2.07c0 .2-.16.36-.36.36s-.36-.16-.36-.36V9.34c0-.16.1-.29.25-.34.04-.01.08-.02.11-.02.11 0 .22.05.29.14l1.68 2.29V9.34c0-.2.16-.36.36-.36s.36.16.36.36v3.33zm2.77-1.67c.2 0 .36.16.36.36s-.16.36-.36.36h-1.4v.59h1.4c.2 0 .36.16.36.36s-.16.36-.36.36h-1.76c-.2 0-.36-.16-.36-.36V9.34c0-.2.16-.36.36-.36h1.76c.2 0 .36.16.36.36s-.16.36-.36.36h-1.4v.59h1.4z"/>
        </svg>
      </Link>
    </div>
  );
}
