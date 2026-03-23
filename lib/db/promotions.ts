import { prisma } from "./prisma";

export interface PromotionRow {
  code:           number;
  name_th:        string;
  filepic:        string;
  active:         string;
  bonus_percent:  number;
  bonus_max:      number;
  bonus_min:      number;
  turnpro:        number;
  content:        string;
}

export async function getPromotions(): Promise<PromotionRow[]> {
  const rows = await prisma.promotions.findMany({
    where:   { enable: "Y" },
    orderBy: { sort: "asc" },
    select: {
      code: true, name_th: true, filepic: true, active: true,
      bonus_percent: true, bonus_max: true, bonus_min: true,
      turnpro: true, content: true,
    },
  });
  return rows.map((r) => ({
    code:          r.code,
    name_th:       r.name_th,
    filepic:       r.filepic,
    active:        String(r.active),
    bonus_percent: Number(r.bonus_percent),
    bonus_max:     Number(r.bonus_max),
    bonus_min:     Number(r.bonus_min),
    turnpro:       Number(r.turnpro),
    content:       r.content,
  }));
}
