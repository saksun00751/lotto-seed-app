import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({ host: url.hostname, port: Number(url.port||3306), user: url.username, password: url.password, database: url.pathname.slice(1) });
const p = new PrismaClient({ adapter });

const tz = await p.$queryRaw<any[]>`SELECT @@global.time_zone as global_tz, @@session.time_zone as session_tz, NOW() as now_db, UTC_TIMESTAMP() as utc_now`;
console.log('DB timezone:', tz[0]);

const round = await p.lotteryRound.findFirst({ orderBy: { closeAt: 'desc' } });
console.log('closeAt raw:', round?.closeAt);
console.log('closeAt ms:', round?.closeAt?.getTime());
console.log('Date.now():', Date.now());
console.log('Node TZ:', Intl.DateTimeFormat().resolvedOptions().timeZone);

await p.$disconnect();
