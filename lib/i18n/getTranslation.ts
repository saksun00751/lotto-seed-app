import th from "./locales/th.json";
import en from "./locales/en.json";
import kh from "./locales/kh.json";
import la from "./locales/la.json";
import my from "./locales/my.json";

const locales = { th, en, kh, la, my } as const;
type Locale = typeof th;
type Lang = keyof typeof locales;

export function getTranslation<N extends keyof Locale>(lang: string | undefined, ns: N): Locale[N] {
  const l = (lang && lang in locales ? lang : "th") as Lang;
  return locales[l][ns] as Locale[N];
}
