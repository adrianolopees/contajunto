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
  group: CategoryGroup;
}

export async function getCategories(): Promise<Category[]> {
  const res = await api.get("/categories");
  return res.data.categories;
}
