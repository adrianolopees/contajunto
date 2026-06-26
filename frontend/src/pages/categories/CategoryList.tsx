import { useCallback, useEffect, useMemo, useState } from "react";
import type { Category } from "@/services/categories";
import { getCategories } from "@/services/categories";
import type { CategorySpending } from "@/services/transactions";
import { getCategorySpending } from "@/services/transactions";
import MonthPicker from "@/components/MonthPicker";
import * as Icons from "lucide-react";
import { Plus } from "lucide-react";
import CategoryForm from "@/components/categories/CategoryForm";

export default function CategoryList() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
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
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handlePrev() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function handleNext() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

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
      <MonthPicker
        month={month}
        year={year}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">Carregando...</p>
      ) : categories.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhuma categoria cadastrada.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {enrichedCategories.map((category) => {
            const Icon = Icons[category.icon as keyof typeof Icons] as Icons.LucideIcon;
            return (
              <li
                key={category.id}
                onClick={() => handleEditCategory(category)}
                className="cursor-pointer rounded-lg border p-3"
              >
                {Icon && <Icon size={20} color={category.color} />}
                <p className="font-medium">{category.name}</p>
                <p className="text-sm text-muted-foreground">
                  R$ {category.total.toFixed(2)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
      <button
        onClick={handleNewCategory}
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
