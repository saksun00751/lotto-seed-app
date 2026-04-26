import { Prompt } from "next/font/google";
import "./globals.css";
import { getTheme, themeToCssVars } from "@/lib/api/theme";
import { getSiteMeta } from "@/lib/api/site";
import SiteHeaderCode from "@/components/providers/SiteHeaderCode";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-prompt",
  display: "swap",
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [theme, siteMeta] = await Promise.all([getTheme(), getSiteMeta()]);
  const cssVars = themeToCssVars(theme) as React.CSSProperties;
  const headerCode = siteMeta?.header_code?.trim();

  return (
    <html lang="th" className={prompt.variable} style={cssVars}>
      <body className="font-sans bg-page-bg">
        {headerCode ? <SiteHeaderCode html={headerCode} /> : null}
        {children}
      </body>
    </html>
  );
}
