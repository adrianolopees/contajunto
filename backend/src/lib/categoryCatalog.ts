import prisma from "./prisma.js";
import { CATALOG_META_ID } from "./catalogSeed.js";

// Versão corrente do catálogo, escrita só pelo seed (CatalogMeta). Sem linha
// (banco nunca semeado) = 0: ninguém sincroniza, ninguém é marcado como em dia.
export async function getCatalogVersion(): Promise<number> {
  const meta = await prisma.catalogMeta.findUnique({
    where: { id: CATALOG_META_ID },
    select: { version: true },
  });
  return meta?.version ?? 0;
}

// Copia pro usuário as DefaultCategory que ele ainda não tem (por groupId+name)
// e carimba a versão que acabou de ser aplicada — sempre a lida do banco, nunca
// uma constante, pra não marcar "em dia" contra um catálogo que ainda não subiu.
export async function syncUserCategories(userId: string, catalogVersion: number) {
  const [defaultCategories, existing] = await Promise.all([
    prisma.defaultCategory.findMany(),
    prisma.category.findMany({
      where: { userId },
      select: { groupId: true, name: true },
    }),
  ]);

  const existingKeys = new Set(existing.map((cat) => `${cat.groupId}:${cat.name}`));
  const missing = defaultCategories.filter(
    (cat) => !existingKeys.has(`${cat.groupId}:${cat.name}`),
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
