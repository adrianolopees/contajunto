import { useCallback, useEffect, useState } from "react";
import { getTransactions, type Transaction } from "@/services/transactions";
import { getCategories, type Category } from "@/services/categories";
import MonthPicker from "@/components/MonthPicker";
import TransactionForm from "@/components/transactions/TransactionForm";
import { Plus } from "lucide-react";

export default function TransactionList() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1); // getMonth() é 0-indexed
  const [year, setYear] = useState(now.getFullYear());
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
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  // transações recarregam quando loadTransactions mudar (ou seja, quando mês/ano mudam)
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

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
      <MonthPicker
        month={month}
        year={year}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">Carregando...</p>
      ) : transactions.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhuma transação neste mês.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {transactions.map((transaction) => (
            <li
              key={transaction.id}
              onClick={() => handleEditTransaction(transaction)}
              className="flex cursor-pointer items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="text-sm font-medium">{transaction.description}</p>
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
                {transaction.type === "INCOME" ? "+" : "-"} R${" "}
                {Number(transaction.amount).toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* FAB — fixed acima da bottom nav (h-16 = 64px) */}
      <button
        onClick={handleNewTransaction}
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
