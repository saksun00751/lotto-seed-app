"use client";

import { useLang } from "./context";
import th from "./locales/th.json";
import en from "./locales/en.json";
import kh from "./locales/kh.json";
import la from "./locales/la.json";
import my from "./locales/my.json";

const locales = { th, en, kh, la, my } as const;

export type Locale = typeof th;
export type Namespace = keyof Locale;

export function useTranslation<N extends Namespace>(ns: N) {
  const { lang } = useLang();
  return locales[lang][ns] as Locale[N];
}
