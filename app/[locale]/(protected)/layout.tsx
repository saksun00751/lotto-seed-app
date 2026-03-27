import { requireAuth } from "@/lib/session/auth";
import UserProvider from "@/components/providers/UserProvider";
import Navbar from "@/components/layout/Navbar";
import { getSiteMeta, getLogoUrl } from "@/lib/api/site";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user    = await requireAuth();
  const meta    = await getSiteMeta();
  const logoUrl = meta ? getLogoUrl(meta.logo) : "/logo.png";
  return (
    <UserProvider user={user}>
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
