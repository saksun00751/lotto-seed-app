import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const dbUrl = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname, port: Number(dbUrl.port || 3306),
  user: dbUrl.username, password: dbUrl.password,
  database: dbUrl.pathname.slice(1), timezone: "+07:00",
});
const prisma = new PrismaClient({ adapter });

const c = await prisma.configs.findFirst({
  select: { sitename:true, name_th:true, lineid:true, linelink:true, website:true, notice:true, title:true, description:true },
});
console.log(JSON.stringify(c, null, 2));
await prisma.$disconnect();
