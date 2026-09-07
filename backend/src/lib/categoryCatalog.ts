import prisma from "./prisma.js";

// Incrementar manualmente sempre que o catálogo em prisma/seed.ts mudar de
// forma relevante (categoria nova, grupo novo) — é o que faz usuários
// existentes (categoriesVersion desatualizado) receberem a atualização no
// próximo login.
export const CATEGORY_CATALOG_VERSION = 2;

export async function syncUserCategories(userId: string) {
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
    data: { categoriesVersion: CATEGORY_CATALOG_VERSION },
  });
}
