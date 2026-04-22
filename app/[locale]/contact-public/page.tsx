import type { Metadata } from "next";
import Link from "next/link";
import { getContactChannels, type ContactChannel } from "@/lib/api/contact-channels";
import { getTranslation } from "@/lib/i18n/getTranslation";
import { getPageMetaTitle } from "@/lib/i18n/metaTitle";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: await getPageMetaTitle(locale, "contactPublic") };
}

function getChannelMeta(type: string, t: ReturnType<typeof getTranslation<"contact">>) {
  if (type === "line") return {
    color: "#06C755",
    title: "LINE Official",
    subtitle: t.lineSubtitle,
    btnLabel: t.lineBtn,
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C6.48 2 2 6.02 2 11c0 3.07 1.6 5.78 4.08 7.5L5 21l3.13-1.56C9.32 19.78 10.63 20 12 20c5.52 0 10-4.02 10-9S17.52 2 12 2zm1 13H7v-1.5h6V15zm2-3H7v-1.5h8V12zm0-3H7V7.5h8V9z" />
      </svg>
    ),
  };
  if (type === "telegram") return {
    color: "#229ED9",
    title: "Telegram",
    subtitle: t.telegramSubtitle,
    btnLabel: t.telegramBtn,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.69 7.96c-.12.55-.46.68-.93.43l-2.57-1.89-1.24 1.19c-.14.14-.25.25-.51.25l.18-2.61 4.7-4.24c.2-.18-.04-.28-.32-.1L7.54 14.5l-2.52-.79c-.55-.17-.56-.55.12-.81l9.86-3.8c.46-.17.86.11.64.7z" />
      </svg>
    ),
  };
  return {
    color: "#6366f1",
    title: type,
    subtitle: "",
    btnLabel: t.defaultBtn,
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  };
}

export default async function ContactPublicPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslation(locale, "contact");
  const loginT = getTranslation(locale, "login");

  let channels: ContactChannel[] = [];
  try {
    channels = await getContactChannels(locale);
  } catch {}

  return (
    <main className="min-h-screen bg-ap-bg pb-10">
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-ap-blue/[0.035] blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-ap-blue/[0.03] blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-5 pt-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold text-ap-primary tracking-tight">{t.title}</h1>
            <p className="text-[14px] text-ap-secondary mt-1">{t.subtitle}</p>
          </div>
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-2 rounded-full border border-ap-border bg-white px-4 py-2 text-[13px] font-semibold text-ap-primary hover:border-ap-blue/40 transition-colors whitespace-nowrap"
          >
            {loginT.submitLogin}
          </Link>
        </div>

        {channels.map((ch) => {
          const meta = getChannelMeta(ch.type, t);
          return (
            <div key={ch.code} className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
              <div className="h-2" style={{ backgroundColor: meta.color }} />
              <div className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: meta.color }}>
                    {meta.icon}
                  </div>
                  <div>
                    <h2 className="text-[18px] font-bold text-ap-primary">{meta.title}</h2>
                    {meta.subtitle && (
                      <p className="text-[13px] text-ap-secondary mt-0.5">{meta.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-ap-bg rounded-xl px-4 py-3 mb-4">
                  <span className="text-[13px] text-ap-secondary">ID</span>
                  <span className="text-[14px] font-bold text-ap-primary font-mono">{ch.label}</span>
                </div>

                <a
                  href={ch.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full text-white rounded-full py-3 text-[14px] font-bold hover:opacity-90 transition-opacity active:scale-[0.98]"
                  style={{ backgroundColor: meta.color }}
                >
                  {meta.btnLabel}
                </a>
              </div>
            </div>
          );
        })}

        {channels.length === 0 && (
          <div className="bg-white rounded-2xl border border-ap-border shadow-card py-14 flex flex-col items-center gap-2 text-ap-tertiary">
            <span className="text-[48px]">💬</span>
            <p className="text-[13px]">{t.empty}</p>
          </div>
        )}
      </div>
    </main>
  );
}
