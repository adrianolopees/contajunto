import prisma from "./prisma.js";
import { Prisma } from "../generated/prisma/index.js";
import { CATALOG_META_ID } from "./catalogSeed.js";
import { groups } from "./catalogData.js";

// Versão corrente do catálogo, escrita só pelo seed (CatalogMeta). Sem linha
// (banco nunca semeado) = 0: ninguém sincroniza, ninguém é marcado como em dia.
export async function getCatalogVersion(): Promise<number> {
  const meta = await prisma.catalogMeta.findUnique({
    where: { id: CATALOG_META_ID },
    select: { version: true },
  });
  return meta?.version ?? 0;
}

const key = (groupId: string, name: string) => `${groupId}:${name}`;

// "grupo|nome antigo" -> nome atual, montado a partir de catalogData
function buildLegacyMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const group of groups) {
    for (const sub of group.subcategories) {
      for (const legacy of sub.legacyNames ?? []) {
        map.set(`${group.name}|${legacy}`, sub.name);
      }
    }
  }
  return map;
}

// Alinha as categorias do usuário ao catálogo atual e carimba a versão lida
// do banco (nunca uma constante — pra não marcar "em dia" contra catálogo que
// ainda não subiu). Três movimentos, nesta ordem:
//  1. categoria com nome antigo mapeado -> renomeia (mantém as transações)
//  2. categoria fora do catálogo sem transação -> apaga; com transação -> fica
//     (é dado do usuário, nunca se destrói)
//  3. o que falta do catálogo -> cria
export async function syncUserCategories(userId: string, catalogVersion: number) {
  const [defaultCategories, existing] = await Promise.all([
    prisma.defaultCategory.findMany(),
    prisma.category.findMany({
      where: { userId },
      select: {
        id: true,
        groupId: true,
        name: true,
        group: { select: { name: true } },
        _count: { select: { transactions: true } },
      },
    }),
  ]);

  const catalogKeys = new Set(defaultCategories.map((c) => key(c.groupId, c.name)));
  const existingKeys = new Set(existing.map((c) => key(c.groupId, c.name)));
  const legacyMap = buildLegacyMap();

  for (const category of existing) {
    if (catalogKeys.has(key(category.groupId, category.name))) continue;

    const newName = legacyMap.get(`${category.group.name}|${category.name}`);
    const newKey = newName ? key(category.groupId, newName) : null;

    if (newName && newKey && !existingKeys.has(newKey)) {
      try {
        await prisma.category.update({
          where: { id: category.id },
          data: { name: newName },
        });
        existingKeys.add(newKey);
        continue;
      } catch (err) {
        // outro login concorrente já criou/renomeou pro nome novo: cai na
        // regra geral abaixo em vez de falhar o login
        if (
          !(err instanceof Prisma.PrismaClientKnownRequestError) ||
          err.code !== "P2002"
        ) {
          throw err;
        }
        existingKeys.add(newKey);
      }
    }

    if (category._count.transactions === 0) {
      await prisma.category.delete({ where: { id: category.id } });
      existingKeys.delete(key(category.groupId, category.name));
    }
  }

  const missing = defaultCategories.filter(
    (cat) => !existingKeys.has(key(cat.groupId, cat.name)),
  );

  if (missing.length > 0) {
    // skipDuplicates -> ON CONFLICT DO NOTHING no Postgres: seguro mesmo se
    // duas requisições do mesmo usuário disparam o sync ao mesmo tempo
    await prisma.category.createMany({
      data: missing.map((cat) => ({
        type: cat.type,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        groupId: cat.groupId,
        userId,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { categoriesVersion: catalogVersion },
  });
}
