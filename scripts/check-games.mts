import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
const dbUrl = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({ host: dbUrl.hostname, port: Number(dbUrl.port||3306), user: dbUrl.username, password: dbUrl.password, database: dbUrl.pathname.slice(1), timezone: "+07:00" });
const prisma = new PrismaClient({ adapter });
const rows = await prisma.games_type.findMany({ where: { status_open: "Y" }, orderBy: { sort: "asc" }, select: { code: true, id: true, title: true, filepic: true, icon: true, content: true } });
console.log(JSON.stringify(rows, null, 2));
await prisma.$disconnect();
