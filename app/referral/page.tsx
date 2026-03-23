import type { Metadata } from "next";
import { headers } from "next/headers";
import Navbar from "@/components/layout/NavbarServer";
import ReferralPage from "@/components/referral/ReferralPage";
import { requireAuth } from "@/lib/session/auth";
import { getReferralStats, getReferralList } from "@/lib/db/referrals";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "แนะนำเพื่อน — Lotto" };

export default async function ReferralRoute() {
  const user = await requireAuth();
  const phone = user.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");

  // Use referralCode (members.refer) stored in DB; fall back if not yet set
  const dbMember = await prisma.members.findFirst({
    where: { code: parseInt(user.id, 10) },
    select: { refer: true },
  });
  const referralCode = dbMember?.refer || ("LT" + user.id.slice(0, 6).toUpperCase());

  // Build full referral link
  const headersList = await headers();
  const host  = headersList.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const referralLink = `${proto}://${host}/register?ref=${referralCode}`;

  // Real stats + list from DB
  const [stats, rawReferrals] = await Promise.all([
    getReferralStats(user.id),
    getReferralList(user.id),
  ]);

  // Serialize Prisma Decimal → number, Date → ISO string
  // (Next.js cannot pass non-plain objects from Server → Client components)
  const referrals = rawReferrals.map((r) => ({
    id:          String(r.id),
    totalEarned: parseFloat(String(r.totalEarned)),
    createdAt:   r.createdAt.toISOString(),
    referee: {
      displayName: r.referee.displayName,
      phone:       r.referee.phone,
      createdAt:   r.referee.createdAt.toISOString(),
    },
  }));

  return (
    <div className="min-h-screen bg-ap-bg pb-20 sm:pb-8">
      <Navbar balance={user.balance} diamond={user.diamond} userName={user.displayName ?? undefined} userPhone={phone} />
      <ReferralPage
        referralCode={referralCode}
        referralLink={referralLink}
        displayName={user.displayName ?? "สมาชิก"}
        referredCount={stats.referredCount}
        totalEarned={stats.totalEarned}
        referrals={referrals}
      />
    </div>
  );
}
