import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "เข้าสู่ระบบ — Lotto" };

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-ap-bg flex flex-col items-center justify-center p-5">

      {/* Soft background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-ap-blue/[0.035] blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-ap-blue/[0.03] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[400px] animate-fade-up">

        {/* Logo + heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-[52px] h-[52px] rounded-[18px] bg-ap-blue shadow-lg mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="white"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-[30px] font-bold text-ap-primary tracking-tight leading-none">
            ยินดีต้อนรับ
          </h1>
          <p className="text-[15px] text-ap-secondary mt-2">
            เข้าสู่ระบบเพื่อเริ่มแทงหวย
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[28px] shadow-card-xl border border-ap-border p-8">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-[11.5px] text-ap-tertiary mt-5 leading-relaxed">
          การเข้าสู่ระบบถือว่าคุณยอมรับ{" "}
          <a href="#" className="underline hover:text-ap-secondary transition-colors">
            ข้อกำหนดการใช้งาน
          </a>{" "}
          และ{" "}
          <a href="#" className="underline hover:text-ap-secondary transition-colors">
            นโยบายความเป็นส่วนตัว
          </a>
        </p>
      </div>
    </main>
  );
}
