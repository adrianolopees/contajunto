import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import type { Category } from "@/services/categories";
import { getCategories } from "@/services/categories";
import { getTransactions } from "@/services/transactions";
import MonthPicker from "@/components/MonthPicker";
import CategoryBadge from "@/components/CategoryBadge";
import { useMonthNavigation } from "@/hooks/useMonthNavigation";
import { formatCurrency } from "@/lib/format";
import * as Icons from "lucide-react";
import { ChevronRight, Plus } from "lucide-react";
import CategoryForm from "@/components/categories/CategoryForm";
import EmptyState from "@/components/EmptyState";
import { cn } from "@/lib/utils";

export default function CategoryList() {
  const { month, year, prev, next } = useMonthNavigation();
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [categories, setCategories] = useState<Category[]>([]);
  const [spendingByCategory, setSpendingByCategory] = useState<
    Map<string, number>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  const enrichedCategories = useMemo(() => {
    return filteredCategories
      .map((category) => ({
        ...category,
        total: spendingByCategory.get(category.id) ?? 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredCategories, spendingByCategory]);

  const totalForType = enrichedCategories.reduce((sum, c) => sum + c.total, 0);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [categoriesData, transactionsData] = await Promise.all([
        getCategories(),
        getTransactions({ month, year }),
      ]);
      setCategories(categoriesData);

      const totals = new Map<string, number>();
      for (const transaction of transactionsData) {
        if (!transaction.category) continue;
        const current = totals.get(transaction.category.id) ?? 0;
        totals.set(
          transaction.category.id,
          current + Number(transaction.amount),
        );
      }
      setSpendingByCategory(totals);
    } catch {
      toast.error("Não foi possível carregar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="p-4 pb-24">
      <h1 className="mb-4 text-xl font-semibold">Categorias</h1>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border p-1">
        <button
          type="button"
          onClick={() => setType("EXPENSE")}
          className={cn(
            "rounded-lg py-2 text-sm font-medium transition-colors",
            type === "EXPENSE"
              ? "bg-expense text-white"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          Gasto
        </button>
        <button
          type="button"
          onClick={() => setType("INCOME")}
          className={cn(
            "rounded-lg py-2 text-sm font-medium transition-colors",
            type === "INCOME"
              ? "bg-income text-white"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          Ganho
        </button>
      </div>

      <div className="mb-4 rounded-xl border p-3">
        <p className="text-xs text-muted-foreground">
          {type === "EXPENSE" ? "Total gasto no mês" : "Total recebido no mês"}
        </p>
        <p className="text-2xl font-bold">{formatCurrency(totalForType)}</p>
      </div>

      <MonthPicker month={month} year={year} onPrev={prev} onNext={next} />

      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">Carregando...</p>
      ) : enrichedCategories.length === 0 ? (
        <EmptyState message="Nenhuma categoria cadastrada." icon={Icons.Tag} />
      ) : (
        <ul className="mt-4 space-y-2">
          {enrichedCategories.map((category) => {
            const limit = category.monthlyLimit
              ? Number(category.monthlyLimit)
              : null;
            const progress = limit ? Math.min(category.total / limit, 1) : 0;

            return (
              <li key={category.id}>
                <Link
                  to={`/categories/${category.id}`}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left"
                >
                  <CategoryBadge
                    icon={category.icon}
                    color={category.color}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{category.name}</p>
                      <p className="shrink-0 text-sm font-medium">
                        {formatCurrency(category.total)}
                      </p>
                    </div>
                    {limit && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${progress * 100}%`,
                            backgroundColor: category.color,
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-muted-foreground"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <button
        onClick={() => setOpen(true)}
        aria-label="Nova categoria"
        className="fixed bottom-20 right-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        <Plus size={24} />
      </button>
      <CategoryForm open={open} onOpenChange={setOpen} onSuccess={loadData} />
    </div>
  );
}
