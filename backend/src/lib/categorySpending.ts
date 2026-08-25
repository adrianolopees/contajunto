import prisma from "./prisma.js";

interface RawSpending {
  categoryId: string | null;
  total: number;
}

async function findCategoriesWithGroup(categoryIds: string[]) {
  return prisma.category.findMany({
    where: { id: { in: categoryIds } },
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
// frontend sem perder o resumo por categoria pai que torna o gráfico legível
export async function groupSpendingByCategoryGroup(
  spending: RawSpending[],
): Promise<GroupedSpending[]> {
  const categoryIds = spending
    .map((item) => item.categoryId)
    .filter((id): id is string => id !== null);

  const categories = await findCategoriesWithGroup(categoryIds);
  const categoryById = new Map(categories.map((c) => [c.id, c] as const));

  const totals = new Map<string, GroupedSpending>();

  for (const item of spending) {
    const category = item.categoryId
      ? categoryById.get(item.categoryId)
      : undefined;
    const group = category?.group ?? null;
    const key = group?.id ?? "none";

    let entry = totals.get(key);
    if (!entry) {
      entry = { group, total: 0, categories: [] };
      totals.set(key, entry);
    }
    entry.total += item.total;

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

  for (const entry of totals.values()) {
    entry.categories.sort((a, b) => b.total - a.total);
  }

  return Array.from(totals.values()).sort((a, b) => b.total - a.total);
}
