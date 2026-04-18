import { requireAuth } from "@/lib/session/auth";
import { getApiToken } from "@/lib/session/cookies";
import UserProvider from "@/components/providers/UserProvider";
import Navbar from "@/components/layout/Navbar";
import { getSiteMeta, getLogoUrl } from "@/lib/api/site";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, apiToken, meta] = await Promise.all([
    requireAuth(),
    getApiToken(),
    getSiteMeta(),
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
      />
      {children}
    </UserProvider>
  );
}
