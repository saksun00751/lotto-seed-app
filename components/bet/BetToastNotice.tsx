"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Toast from "@/components/ui/Toast";

export default function BetToastNotice() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const toast = searchParams.get("toast");
    if (!toast) return;
    setMsg(decodeURIComponent(toast));
    // Remove the query param from URL without re-render
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    const qs = params.toString();
    router.replace(pathname + (qs ? `?${qs}` : ""), { scroll: false });
  }, [searchParams, router, pathname]);

  if (!msg) return null;
  return <Toast message={msg} type="warning" onClose={() => setMsg(null)} />;
}
