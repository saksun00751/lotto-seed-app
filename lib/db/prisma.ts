import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const dbUrl = new URL(process.env.DATABASE_URL!);
  const adapter = new PrismaMariaDb({
    host:            dbUrl.hostname,
    port:            Number(dbUrl.port || 3306),
    user:            dbUrl.username,
    password:        dbUrl.password,
    database:        dbUrl.pathname.slice(1),
    connectionLimit: 10,   // max connections in pool
    minimumIdle:     2,    // keep 2 connections always warm
    idleTimeout:     60,   // close idle connection after 60s
    timezone:        "+07:00",
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.prisma ?? createPrismaClient();

// เก็บ singleton ทั้ง dev และ production เพื่อป้องกัน multiple instances
globalThis.prisma = prisma;
