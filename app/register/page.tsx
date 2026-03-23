import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "สมัครสมาชิก — Lotto" };

interface Props {
  searchParams?: Promise<{ ref?: string }>;
}

export default async function RegisterPage({ searchParams }: Props) {
  const params     = await searchParams;
  const defaultRef = (params?.ref ?? "").toUpperCase();

  return (
    <main className="min-h-screen bg-ap-bg flex flex-col items-center justify-center p-5">

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-ap-green/[0.04] blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-ap-blue/[0.03] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px] animate-fade-up">

        {/* Logo + heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-[52px] h-[52px] rounded-[18px] bg-ap-blue shadow-lg mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="white" />
              <path
                d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-ap-blue flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">1</span>
              </div>
              <span className="text-[12px] text-ap-blue font-medium">กรอกข้อมูล</span>
            </div>
            {/* <div className="w-8 h-px bg-ap-border" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-ap-border flex items-center justify-center">
                <span className="text-ap-tertiary text-[11px] font-bold">2</span>
              </div>
              <span className="text-[12px] text-ap-tertiary">ยืนยัน OTP</span>
            </div> */}
            <div className="w-8 h-px bg-ap-border" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-ap-border flex items-center justify-center">
                <span className="text-ap-tertiary text-[11px] font-bold">2</span>
              </div>
              <span className="text-[12px] text-ap-tertiary">เสร็จสิ้น</span>
            </div>
          </div>

          <h1 className="text-[28px] font-bold text-ap-primary tracking-tight leading-none">
            สมัครสมาชิกฟรี
          </h1>
          <p className="text-[15px] text-ap-secondary mt-2">
            เริ่มแทงหวยได้ทันที ไม่มีค่าธรรมเนียม
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[28px] shadow-card-xl border border-ap-border p-8">
          <RegisterForm defaultRef={defaultRef} />
        </div>

        {/* Footer */}
        <p className="text-center text-[11.5px] text-ap-tertiary mt-5 leading-relaxed">
          ข้อมูลของคุณปลอดภัย เข้ารหัสด้วย SSL 256-bit
          <br />
          <span className="inline-flex items-center gap-1 mt-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            ปลอดภัย · เชื่อถือได้ · ไม่แชร์ข้อมูล
          </span>
        </p>
      </div>
    </main>
  );
}
