import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const dbUrl = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname, port: Number(dbUrl.port || 3306),
  user: dbUrl.username, password: dbUrl.password,
  database: dbUrl.pathname.slice(1), timezone: "+07:00",
});
const prisma = new PrismaClient({ adapter });

// lotto_draws ที่ open
const draws = await prisma.lotto_draws.findMany({
  where: { status: "open" },
  include: { lotto_markets: { select: { code: true, name: true } } },
  take: 10,
});
console.log("\n=== lotto_draws (open) ===");
if (draws.length === 0) console.log("  (ไม่มี draw ที่ open)");
draws.forEach((d) => console.log(`  id=${d.id}  market=${d.lotto_markets?.code}/${d.lotto_markets?.name}  close_at=${d.close_at}`));

// lotto_market_bet_settings
const settings = await prisma.lotto_market_bet_settings.findMany({ take: 10 });
console.log("\n=== lotto_market_bet_settings ===");
if (settings.length === 0) console.log("  (ว่าง)");
settings.forEach((s) => console.log(`  market_id=${s.market_id}  bet_type=${s.bet_type}  enabled=${s.is_enabled}  min=${s.min_bet}  max=${s.max_bet}`));

// lotto_rate_plans
const plans = await prisma.lotto_rate_plans.findMany({
  where: { is_enabled: true },
  include: { lotto_rate_plan_items: true },
  take: 5,
});
console.log("\n=== lotto_rate_plans (enabled) ===");
if (plans.length === 0) console.log("  (ว่าง)");
plans.forEach((p) => {
  console.log(`  id=${p.id}  group_id=${p.group_id}  items=${p.lotto_rate_plan_items.length}`);
  p.lotto_rate_plan_items.forEach((i) => console.log(`    bet_type=${i.bet_type}  payout=${i.payout}`));
});

await prisma.$disconnect();
