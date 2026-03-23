import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import ContactFAB from "@/components/ui/ContactFAB";
import ProgressBar from "@/components/ui/ProgressBar";
import "./globals.css";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lotto",
  description: "หวยออนไลน์",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={prompt.variable}>
      <body className="font-sans bg-ap-bg">
        <ProgressBar />
        {children}
        {/* <ContactFAB /> */}
      </body>
    </html>
  );
}
