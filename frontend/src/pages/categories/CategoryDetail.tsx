import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { getCategories, type Category } from "@/services/categories";
import { getTransactions, type Transaction } from "@/services/transactions";
import { Button } from "@/components/ui/button";
import CategoryBadge from "@/components/CategoryBadge";
import EmptyState from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { formatCurrency, formatTransactionTimestamp } from "@/lib/format";

function previousMonth(month: number, year: number) {
  return month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState<Category | undefined>();
  const [currentTransactions, setCurrentTransactions] = useState<
    Transaction[]
  >([]);
  const [previousTotal, setPreviousTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const prev = previousMonth(month, year);

      const [categories, currentMonthTx, previousMonthTx] = await Promise.all([
        getCategories(),
        getTransactions({ month, year }),
        getTransactions({ month: prev.month, year: prev.year }),
      ]);

      const found = categories.find((c) => c.id === id);
      if (!found) {
        navigate("/categories");
        return;
      }
      setCategory(found);
      setCurrentTransactions(
        currentMonthTx.filter((t) => t.category?.id === id),
      );
      setPreviousTotal(
        previousMonthTx
          .filter((t) => t.category?.id === id)
          .reduce((sum, t) => sum + Number(t.amount), 0),
      );
    } catch {
      toast.error("Não foi possível carregar a categoria.");
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading || !category) {
    return (
      <div className="p-4">
        <p className="py-8 text-center text-muted-foreground">
          Carregando...
        </p>
      </div>
    );
  }

  const total = currentTransactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0,
  );

  const today = new Date();
  const mediaDiaria = total / today.getDate();
  const compras = currentTransactions.length;
  const vsLastMonth =
    previousTotal > 0
      ? Math.round(((total - previousTotal) / previousTotal) * 100)
      : total > 0
        ? 100
        : 0;

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(today);
    day.setDate(day.getDate() - (6 - i));
    const dayTotal = currentTransactions
      .filter((t) => isSameDay(new Date(t.date), day))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return dayTotal;
  });
  const maxDay = Math.max(...last7Days, 1);

  return (
    <div className="space-y-4 px-4 py-4 pb-24">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          render={<Link to="/categories" />}
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-lg font-semibold">{category.name}</h1>
      </div>

      <div className="rounded-xl border p-4">
        <div className="flex items-center gap-3">
          <CategoryBadge icon={category.icon} color={category.color} size={44} />
          <p className="text-2xl font-bold">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">Média diária</p>
          <p className="font-semibold">{formatCurrency(mediaDiaria)}</p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">Compras</p>
          <p className="font-semibold">{compras}</p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">vs. mês ant.</p>
          <p
            className={cn(
              "font-semibold",
              vsLastMonth > 0
                ? "text-expense"
                : vsLastMonth < 0
                  ? "text-income"
                  : "",
            )}
          >
            {vsLastMonth > 0 ? "+" : ""}
            {vsLastMonth}%
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Últimos 7 dias
        </h2>
        <div className="flex h-16 items-end gap-2">
          {last7Days.map((value, i) => (
            <div
              key={i}
              className="flex-1 rounded-md"
              style={{
                height: `${Math.max((value / maxDay) * 100, 8)}%`,
                backgroundColor: category.color,
                opacity: value === 0 ? 0.25 : 1,
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-medium">Transações</h2>
        {currentTransactions.length === 0 ? (
          <EmptyState message="Nenhuma transação nesta categoria." />
        ) : (
          <ul className="space-y-2">
            {currentTransactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {transaction.description || "Sem descrição"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTransactionTimestamp(transaction.date)}
                  </p>
                </div>
                <p
                  className={
                    transaction.type === "INCOME"
                      ? "font-medium text-income"
                      : "font-medium text-expense"
                  }
                >
                  {transaction.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(Number(transaction.amount))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
