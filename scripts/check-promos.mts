import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const dbUrl = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname, port: Number(dbUrl.port || 3306),
  user: dbUrl.username, password: dbUrl.password,
  database: dbUrl.pathname.slice(1), timezone: "+07:00",
});
const prisma = new PrismaClient({ adapter });

const rows = await prisma.promotions.findMany({
  where: { enable: "Y" },
  select: { code: true, name_th: true, filepic: true, active: true, bonus_percent: true, bonus_max: true, bonus_min: true, turnpro: true, content: true, huay: true, lotto: true },
  take: 10,
});
console.log(JSON.stringify(rows, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
await prisma.$disconnect();
