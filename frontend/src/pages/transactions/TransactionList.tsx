import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getTransactions, type Transaction } from "@/services/transactions";
import MonthPicker from "@/components/MonthPicker";
import { useMonthNavigation } from "@/hooks/useMonthNavigation";
import { formatCurrency } from "@/lib/format";
import { Plus } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default function TransactionList() {
  const { month, year, prev, next } = useMonthNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getTransactions({ month, year });
      setTransactions(data);
    } catch {
      toast.error("Não foi possível carregar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return (
    <div className="p-4 pb-24">
      <MonthPicker month={month} year={year} onPrev={prev} onNext={next} />

      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">Carregando...</p>
      ) : transactions.length === 0 ? (
        <EmptyState message="Nenhuma transação neste mes." />
      ) : (
        <ul className="mt-4 space-y-2">
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              <Link
                to={`/transactions/${transaction.id}/edit`}
                className="flex w-full items-center justify-between rounded-lg border p-3 text-left"
              >
                <div>
                  <p className="text-sm font-medium">
                    {transaction.description || "Sem descrição"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.category?.name ?? "Sem categoria"}
                  </p>
                </div>
                <p
                  className={
                    transaction.type === "INCOME"
                      ? "font-medium text-income"
                      : "font-medium text-expense"
                  }
                >
                  {transaction.type === "INCOME" ? "+" : "-"}{" "}
                  {formatCurrency(Number(transaction.amount))}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/transactions/new"
        aria-label="Nova transação"
        className="fixed bottom-20 right-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}
