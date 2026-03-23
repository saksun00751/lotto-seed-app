import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
const dbUrl = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({ host: dbUrl.hostname, port: Number(dbUrl.port||3306), user: dbUrl.username, password: dbUrl.password, database: dbUrl.pathname.slice(1), timezone: "+07:00" });
const prisma = new PrismaClient({ adapter });

// distinct game_type values
const rows = await prisma.games_seamless.findMany({
  where: { status_open: "Y", enable: "Y" },
  select: { code: true, id: true, game_type: true, name: true, filepic: true, icon: true, sort: true },
  orderBy: [{ game_type: "asc" }, { sort: "asc" }],
  take: 20,
});
console.log(JSON.stringify(rows, null, 2));
await prisma.$disconnect();
