import { api } from "@/lib/api";

export interface CategoryGroupBudget {
  groupId: string;
  amount: string;
}

export async function getCategoryGroupBudgets(): Promise<
  CategoryGroupBudget[]
> {
  const res = await api.get("/category-budgets");
  return res.data.budgets;
}

export async function setCategoryGroupBudgets(
  budgets: { groupId: string; amount: number | null }[],
): Promise<CategoryGroupBudget[]> {
  const res = await api.put("/category-budgets", { budgets });
  return res.data.budgets;
}
