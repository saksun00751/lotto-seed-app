import { prisma } from "./prisma";

export async function getAnnouncementTicker(): Promise<string> {
  const rows = await prisma.notices.findMany({
    where:   { enable: "Y" },
    orderBy: { date_create: "desc" },
    select:  { message: true },
  });
  return rows.map((r) => r.message).join("   ·   ");
}
