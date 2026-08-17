import { api } from "@/lib/api";

export interface Category {
  id: string;
  type: "INCOME" | "EXPENSE";
  name: string;
  color: string;
  icon: string;
  monthlyLimit: string | null;
}

type CategoryInput = Omit<Category, "id" | "monthlyLimit"> & {
  monthlyLimit?: number | null;
};

export async function createCategory(
  data: CategoryInput,
): Promise<Category> {
  const res = await api.post("/categories", data);
  return res.data.category;
}

export async function getCategories(): Promise<Category[]> {
  const res = await api.get("/categories");
  return res.data.categories;
}

export async function updateCategory(
  id: string,
  data: Partial<CategoryInput>,
): Promise<Category> {
  const res = await api.patch(`/categories/${id}`, data);
  return res.data.category;
}

export async function getDefaultCategories(): Promise<Category[]> {
  const res = await api.get("/categories/default");
  return res.data.categoriesDefault;
}

export async function deleteCategory(id: string) {
  await api.delete(`/categories/${id}`);
}
