import prisma from "./prisma.js";

interface RawSpending {
  categoryId: string | null;
  total: number;
}

async function findCategoriesWithGroup(categoryIds: string[]) {
  return prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, group: true },
  });
}

type CategoryGroupInfo = Awaited<
  ReturnType<typeof findCategoriesWithGroup>
>[number]["group"];

export interface GroupedSpending {
  group: CategoryGroupInfo | null;
  total: number;
}

// reagrupa gastos já somados por subcategoria em totais por categoria pai —
// o gráfico do dashboard fica ilegível com uma fatia por subcategoria
export async function groupSpendingByCategoryGroup(
  spending: RawSpending[],
): Promise<GroupedSpending[]> {
  const categoryIds = spending
    .map((item) => item.categoryId)
    .filter((id): id is string => id !== null);

  const categories = await findCategoriesWithGroup(categoryIds);
  const groupByCategoryId = new Map(
    categories.map((c) => [c.id, c.group] as const),
  );

  const totals = new Map<string, GroupedSpending>();

  for (const item of spending) {
    const group = item.categoryId
      ? (groupByCategoryId.get(item.categoryId) ?? null)
      : null;
    const key = group?.id ?? "none";
    const entry = totals.get(key);
    if (entry) {
      entry.total += item.total;
    } else {
      totals.set(key, { group, total: item.total });
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.total - a.total);
}
