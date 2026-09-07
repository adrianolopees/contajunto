import prisma from "./prisma.js";

interface RawSpending {
  categoryId: string | null;
  total: number;
}

// `userIds` restringe as categorias aos donos das transações somadas. Hoje a
// invariante (categoryId sempre do mesmo dono) já é garantida no create/update;
// o filtro é cinto de segurança pra ela nunca virar vazamento entre contas.
async function findCategoriesWithGroup(categoryIds: string[], userIds: string[]) {
  return prisma.category.findMany({
    where: { id: { in: categoryIds }, userId: { in: userIds } },
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      userId: true,
      group: true,
    },
  });
}

type CategoryWithGroup = Awaited<
  ReturnType<typeof findCategoriesWithGroup>
>[number];
type CategoryGroupInfo = CategoryWithGroup["group"];

export interface CategorySpendingLeaf {
  id: string;
  name: string;
  color: string;
  icon: string;
  userId: string;
  total: number;
}

export interface GroupedSpending {
  group: CategoryGroupInfo | null;
  total: number;
  categories: CategorySpendingLeaf[];
}

// reagrupa gastos já somados por subcategoria em totais por categoria pai —
// mantém cada subcategoria em `categories` pra permitir expandir o grupo no
// frontend sem perder o resumo por categoria pai que torna o gráfico legível.
// Soma em centavos (inteiros), como os summaries: somar Decimal->Number em
// float acumula ruído tipo 1531.4200000001
export async function groupSpendingByCategoryGroup(
  spending: RawSpending[],
  userIds: string[],
): Promise<GroupedSpending[]> {
  const categoryIds = spending
    .map((item) => item.categoryId)
    .filter((id): id is string => id !== null);

  const categories = await findCategoriesWithGroup(categoryIds, userIds);
  const categoryById = new Map(categories.map((c) => [c.id, c] as const));

  const totals = new Map<
    string,
    { group: CategoryGroupInfo | null; totalCents: number; categories: CategorySpendingLeaf[] }
  >();

  for (const item of spending) {
    const category = item.categoryId
      ? categoryById.get(item.categoryId)
      : undefined;
    const group = category?.group ?? null;
    const key = group?.id ?? "none";

    let entry = totals.get(key);
    if (!entry) {
      entry = { group, totalCents: 0, categories: [] };
      totals.set(key, entry);
    }
    entry.totalCents += Math.round(item.total * 100);

    if (category) {
      entry.categories.push({
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        userId: category.userId,
        total: item.total,
      });
    }
  }

  return Array.from(totals.values())
    .map((entry) => ({
      group: entry.group,
      total: entry.totalCents / 100,
      categories: [...entry.categories].sort((a, b) => b.total - a.total),
    }))
    .sort((a, b) => b.total - a.total);
}
