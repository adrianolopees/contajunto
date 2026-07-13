import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getTransactions, type Transaction } from "@/services/transactions";
import { getCategories, type Category } from "@/services/categories";
import MonthPicker from "@/components/MonthPicker";
import TransactionForm from "@/components/transactions/TransactionForm";
import { useMonthNavigation } from "@/hooks/useMonthNavigation";
import { formatCurrency } from "@/lib/format";
import { Plus } from "lucide-react";

export default function TransactionList() {
  const { month, year, prev, next } = useMonthNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<
    Transaction | undefined
  >();

  // categorias só precisam ser carregadas uma vez
  useEffect(() => {
    async function fetchCategories() {
      const data = await getCategories();
      setCategories(data);
    }
    fetchCategories();
  }, []);

  // useCallback memoriza a função — só recria quando month/year mudam
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

  // transações recarregam quando loadTransactions mudar (ou seja, quando mês/ano mudam)
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  function handleNewTransaction() {
    setSelectedTransaction(undefined);
    setOpen(true);
  }

  function handleEditTransaction(transaction: Transaction) {
    setSelectedTransaction(transaction);
    setOpen(true);
  }

  return (
    <div className="p-4 pb-24">
      <MonthPicker month={month} year={year} onPrev={prev} onNext={next} />

      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">Carregando...</p>
      ) : transactions.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhuma transação neste mês.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              <button
                type="button"
                onClick={() => handleEditTransaction(transaction)}
                className="flex w-full cursor-pointer items-center justify-between rounded-lg border p-3 text-left"
              >
                <div>
                  <p className="text-sm font-medium">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.category?.name ?? "Sem categoria"}
                  </p>
                </div>
                <p
                  className={
                    transaction.type === "INCOME"
                      ? "font-medium text-green-600"
                      : "font-medium text-red-500"
                  }
                >
                  {transaction.type === "INCOME" ? "+" : "-"}{" "}
                  {formatCurrency(Number(transaction.amount))}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* FAB — fixed acima da bottom nav (h-16 = 64px) */}
      <button
        onClick={handleNewTransaction}
        aria-label="Nova transação"
        className="fixed bottom-20 right-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        <Plus size={24} />
      </button>

      <TransactionForm
        open={open}
        onOpenChange={setOpen}
        transaction={selectedTransaction}
        categories={categories}
        onSuccess={loadTransactions}
      />
    </div>
  );
}
