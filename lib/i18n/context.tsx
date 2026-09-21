"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export type LangCode = "th" | "en" | "kh" | "la" | "my";

const VALID_LANGS: LangCode[] = ["th", "en", "kh", "la", "my"];

interface LangContextValue {
  lang: LangCode;
  setLang: (l: LangCode) => void;
}

const LangContext = createContext<LangContextValue>({ lang: "th", setLang: () => {} });

export function LangProvider({ children, initialLang }: { children: React.ReactNode; initialLang?: string }) {
  const [lang, setLangState] = useState<LangCode>(
    VALID_LANGS.includes(initialLang as LangCode) ? (initialLang as LangCode) : "th"
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    // The URL is canonical; an older saved preference must not override /my (or any direct locale link).
    if (VALID_LANGS.includes(initialLang as LangCode)) {
      setLangState(initialLang as LangCode);
      localStorage.setItem("lang", initialLang as LangCode);
      document.cookie = `lotto_lang=${initialLang}; path=/; max-age=604800; samesite=lax`;
      return;
    }
    const saved = localStorage.getItem("lang") as LangCode;
    if (VALID_LANGS.includes(saved)) {
      setLangState(saved);
      document.cookie = `lotto_lang=${saved}; path=/; max-age=604800; samesite=lax`;
    } else {
      // sync initialLang → localStorage
      localStorage.setItem("lang", lang);
    }
  }, [initialLang]);

  function setLang(l: LangCode) {
    setLangState(l);
    localStorage.setItem("lang", l);
    document.cookie = `lotto_lang=${l}; path=/; max-age=604800; samesite=lax`;
    // Replace the locale segment in the current path
    const segments = pathname.split("/").filter(Boolean);
    if (VALID_LANGS.includes(segments[0] as LangCode)) {
      segments[0] = l;
    } else {
      segments.unshift(l);
    }
    const query = searchParams.toString();
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const nextPath = "/" + segments.join("/");
    const nextUrl = `${nextPath}${query ? `?${query}` : ""}${hash}`;
    router.push(nextUrl);
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
