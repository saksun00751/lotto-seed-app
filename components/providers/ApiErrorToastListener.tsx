"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

const API_ERROR_EVENT = "app:api-error";

export default function ApiErrorToastListener() {
  const lastRef = useRef<{ message: string; at: number } | null>(null);

  useEffect(() => {
    function onApiError(event: Event) {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      const message = detail?.message?.trim();
      if (!message) return;

      // avoid duplicate toast spam when same error bubbles in a very short window
      const now = Date.now();
      if (lastRef.current && lastRef.current.message === message && now - lastRef.current.at < 800) {
        return;
      }
      lastRef.current = { message, at: now };

      toast.error(message, { duration: 5000 });
    }

    window.addEventListener(API_ERROR_EVENT, onApiError as EventListener);
    return () => window.removeEventListener(API_ERROR_EVENT, onApiError as EventListener);
  }, []);

  return null;
}
