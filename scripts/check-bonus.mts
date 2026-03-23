import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const dbUrl = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname, port: Number(dbUrl.port || 3306),
  user: dbUrl.username, password: dbUrl.password,
  database: dbUrl.pathname.slice(1), timezone: "+07:00",
});
const prisma = new PrismaClient({ adapter });

const rows = await (prisma as any).bonus.findMany({ take: 5 });
console.log(JSON.stringify(rows, null, 2));
await prisma.$disconnect();
