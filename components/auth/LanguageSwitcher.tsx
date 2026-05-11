"use client";

import { useLang, type LangCode } from "@/lib/i18n/context";

const LANGS: { code: LangCode; label: string; flag: string; flagIcon: string }[] = [
  { code: "th", label: "ไทย",   flag: "🇹🇭", flagIcon: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f9-1f1ed.svg" },
  { code: "en", label: "EN",    flag: "🇬🇧", flagIcon: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1ec-1f1e7.svg" },
  { code: "kh", label: "ខ្មែរ", flag: "🇰🇭", flagIcon: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f0-1f1ed.svg" },
  { code: "la", label: "ລາວ",   flag: "🇱🇦", flagIcon: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f1-1f1e6.svg" },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex items-center justify-center gap-1.5">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${
            lang === l.code
              ? "bg-ui-button-primary text-ui-text-inverse shadow-sm"
              : "bg-surface-card border border-ui-border text-ui-text-soft hover:border-ui-selected-border/40 hover:text-ui-text"
          }`}
        >
          <img src={l.flagIcon} alt={l.flag} className="w-4 h-4 rounded-sm object-cover" />
          <span>{l.label}</span>
        </button>
      ))}
    </div>
  );
}
