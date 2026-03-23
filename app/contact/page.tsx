import type { Metadata } from "next";
import Navbar from "@/components/layout/NavbarServer";
import { requireAuth } from "@/lib/session/auth";
import { getContactConfig } from "@/lib/db/configs";

export const metadata: Metadata = { title: "ติดต่อเรา — Lotto" };

export default async function ContactPage() {
  const user   = await requireAuth();
  const config = await getContactConfig();
  const phone  = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Navbar balance={user.balance} diamond={user.diamond} userName={user.displayName ?? undefined} userPhone={phone} />
      <div className="max-w-2xl mx-auto px-5 pt-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-[22px] font-bold text-ap-primary tracking-tight">ติดต่อเรา</h1>
          {config?.title && (
            <p className="text-[14px] text-ap-secondary mt-1">{config.title}</p>
          )}
        </div>

        {/* Notice */}
        {config?.notice && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 text-[13px] text-yellow-800 font-medium">
            {config.notice}
          </div>
        )}

        {/* LINE Card */}
        {config?.linelink && (
          <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
            <div className="h-2 bg-[#06C755]" />
            <div className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-[#06C755] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C6.48 2 2 6.02 2 11c0 3.07 1.6 5.78 4.08 7.5L5 21l3.13-1.56C9.32 19.78 10.63 20 12 20c5.52 0 10-4.02 10-9S17.52 2 12 2zm1 13H7v-1.5h6V15zm2-3H7v-1.5h8V12zm0-3H7V7.5h8V9z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-ap-primary">LINE Official</h2>
                  <p className="text-[13px] text-ap-secondary mt-0.5">ช่องทางหลักสำหรับติดต่อ</p>
                </div>
              </div>

              <div className="space-y-3">
                {config.lineid && (
                  <div className="flex items-center justify-between bg-ap-bg rounded-xl px-4 py-3">
                    <span className="text-[13px] text-ap-secondary">LINE ID</span>
                    <span className="text-[14px] font-bold text-ap-primary font-mono">@{config.lineid}</span>
                  </div>
                )}
                <div className="flex items-center justify-between bg-ap-bg rounded-xl px-4 py-3">
                  <span className="text-[13px] text-ap-secondary">เวลาทำการ</span>
                  <span className="text-[14px] font-semibold text-ap-primary">ตลอด 24 ชม.</span>
                </div>
              </div>

              <a
                href={config.linelink.startsWith("http") ? config.linelink : "https://line.me/ti/p/~" + config.linelink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full bg-[#06C755] text-white rounded-full py-3 text-[14px] font-bold hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                เพิ่มเพื่อนใน LINE
              </a>
            </div>
          </div>
        )}

        {/* Website Card */}
        {config?.website && (
          <div className="bg-white rounded-2xl border border-ap-border shadow-card overflow-hidden">
            <div className="h-2 bg-ap-blue" />
            <div className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-ap-blue flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-ap-primary">เว็บไซต์</h2>
                  {config.sitename && (
                    <p className="text-[13px] text-ap-secondary mt-0.5">{config.sitename}</p>
                  )}
                </div>
              </div>

              <div className="bg-ap-bg rounded-xl px-4 py-3 mb-4">
                <p className="text-[13px] text-ap-secondary truncate">{config.website}</p>
              </div>

              {config.description && (
                <p className="text-[13px] text-ap-secondary leading-relaxed mb-4">{config.description}</p>
              )}

              <a
                href={config.website.startsWith("http") ? config.website : "https://" + config.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-ap-blue text-white rounded-full py-3 text-[14px] font-bold hover:bg-ap-blue-h transition-colors active:scale-[0.98]"
              >
                เปิดเว็บไซต์
              </a>
            </div>
          </div>
        )}

        {!config && (
          <div className="bg-white rounded-2xl border border-ap-border shadow-card py-14 flex flex-col items-center gap-2 text-ap-tertiary">
            <span className="text-[48px]">💬</span>
            <p className="text-[13px]">ไม่พบข้อมูลติดต่อ</p>
          </div>
        )}

        {config?.sitename && (
          <p className="text-center text-[11px] text-ap-tertiary pb-2">{config.sitename}</p>
        )}

      </div>
    </div>
  );
}