import { requireAuth } from "@/lib/session/auth";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";
import UserProvider from "@/components/providers/UserProvider";
import Navbar from "@/components/layout/Navbar";
import { getSiteMeta, getLogoUrl } from "@/lib/api/site";
import { getNavbarConfig } from "@/lib/api/navbar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [apiToken, lang] = await Promise.all([getApiToken(), getLangCookie()]);
  const [user, meta, mobileNavItems] = await Promise.all([
    requireAuth(),
    getSiteMeta(),
    getNavbarConfig(apiToken ?? undefined, lang),
  ]);
  const logoUrl = meta ? getLogoUrl(meta.logo) : "/logo.png";
  return (
    <UserProvider user={user} apiToken={apiToken ?? ""}>
      <Navbar
        logoUrl={logoUrl}
        balance={user.balance}
        diamond={user.diamond}
        userName={user.displayName}
        userPhone={user.phone}
        mobileNavItems={mobileNavItems}
      />
      {children}
    </UserProvider>
  );
}
