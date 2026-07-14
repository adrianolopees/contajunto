import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { Category } from "@/services/categories";
import { getCategories } from "@/services/categories";
import type { CategorySpending } from "@/services/transactions";
import { getCategorySpending } from "@/services/transactions";
import MonthPicker from "@/components/MonthPicker";
import { useMonthNavigation } from "@/hooks/useMonthNavigation";
import { formatCurrency } from "@/lib/format";
import * as Icons from "lucide-react";
import { Plus } from "lucide-react";
import CategoryForm from "@/components/categories/CategoryForm";
import EmptyState from "@/components/EmptyState";

export default function CategoryList() {
  const { month, year, prev, next } = useMonthNavigation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    Category | undefined
  >(undefined);

  const enrichedCategories = useMemo(() => {
    return categories.map((category) => {
      const spending = categorySpending.find(
        (s) => s.categoryId === category.id,
      );
      return { ...category, total: spending?.total ?? 0 };
    });
  }, [categories, categorySpending]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [categories, categorySpending] = await Promise.all([
        getCategories(),
        getCategorySpending({ month, year }),
      ]);
      setCategories(categories);
      setCategorySpending(categorySpending);
    } catch {
      toast.error("Não foi possível carregar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleNewCategory() {
    setSelectedCategory(undefined);
    setOpen(true);
  }

  function handleEditCategory(category: Category) {
    setSelectedCategory(category);
    setOpen(true);
  }

  return (
    <div className="p-4 pb-24">
      <MonthPicker month={month} year={year} onPrev={prev} onNext={next} />

      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">Carregando...</p>
      ) : categories.length === 0 ? (
        <EmptyState message="Nenhuma categoria cadastrada." icon={Icons.Tag} />
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {enrichedCategories.map((category) => {
            const Icon = Icons[
              category.icon as keyof typeof Icons
            ] as Icons.LucideIcon;
            return (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => handleEditCategory(category)}
                  className="w-full cursor-pointer rounded-lg border p-3 text-left"
                >
                  {Icon && <Icon size={20} color={category.color} />}
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(category.total)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <button
        onClick={handleNewCategory}
        aria-label="Nova categoria"
        className="fixed bottom-20 right-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        <Plus size={24} />
      </button>
      <CategoryForm
        open={open}
        onOpenChange={setOpen}
        category={selectedCategory}
        onSuccess={loadData}
      />
    </div>
  );
}
