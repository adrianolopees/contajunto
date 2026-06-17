import { api } from "@/lib/api";

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export async function createCategory(
  data: Omit<Category, "id">,
): Promise<Category> {
  const res = await api.post("/categories", data);
  return res.data.newCategory;
}

export async function getCategories(): Promise<Category[]> {
  const res = await api.get("/categories");
  return res.data.categories;
}

export async function updateCategory(
  id: string,
  data: Partial<Omit<Category, "id">>,
): Promise<Category> {
  const res = await api.patch(`/categories/${id}`, data);
  return res.data.updatedCategory;
}

export async function getDefaultCategories(): Promise<Category[]> {
  const res = await api.get("/categories/default");
  return res.data.categoriesDefault;
}

export async function deleteCategory(id: string) {
  await api.delete(`/categories/${id}`);
}
