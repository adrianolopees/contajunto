import { api } from "@/lib/api";

export interface CategoryGroup {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Category {
  id: string;
  type: "INCOME" | "EXPENSE";
  name: string;
  color: string;
  icon: string;
  monthlyLimit: string | null;
  group: CategoryGroup;
}

export async function getCategories(): Promise<Category[]> {
  const res = await api.get("/categories");
  return res.data.categories;
}

export async function updateCategory(
  id: string,
  data: { monthlyLimit?: number | null },
): Promise<Category> {
  const res = await api.patch(`/categories/${id}`, data);
  return res.data.category;
}
