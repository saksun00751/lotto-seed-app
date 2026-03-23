import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname, port: Number(url.port||3306),
  user: url.username, password: url.password,
  database: url.pathname.slice(1),
});
const p = new PrismaClient({ adapter });
const [slips, items, rounds, rates] = await Promise.all([
  p.betSlip.count(), p.betItem.count(), p.lotteryRound.count(), p.betRate.count()
]);
console.log('bet_slips:', slips, '| bet_items:', items, '| lottery_rounds:', rounds, '| bet_rates:', rates);
await p.$disconnect();
