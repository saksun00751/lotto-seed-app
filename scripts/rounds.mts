import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({ host: url.hostname, port: Number(url.port||3306), user: url.username, password: url.password, database: url.pathname.slice(1) });
const p = new PrismaClient({ adapter });

const rounds = await p.lotteryRound.findMany({ orderBy: { closeAt: 'asc' } });
for (const r of rounds) {
  const local = new Date(r.closeAt.getTime()).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  console.log(`[${r.id}] ${r.lotteryTypeId} | status: ${r.status} | closeAt(raw): ${r.closeAt.toISOString()} | +7: ${local}`);
}

await p.$disconnect();
