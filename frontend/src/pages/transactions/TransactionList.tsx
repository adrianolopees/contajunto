import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getTransactions, type Transaction } from "@/services/transactions";
import { getCategories, type Category } from "@/services/categories";
import MonthPicker from "@/components/MonthPicker";
import TransactionRow from "@/components/transactions/TransactionRow";
import TransactionEditDialogs from "@/components/transactions/TransactionEditDialogs";
import { useInlineTransactionEdit } from "@/hooks/useInlineTransactionEdit";
import { useMonthNavigation } from "@/hooks/useMonthNavigation";
import { useAuth } from "@/hooks/useAuth";
import EmptyState from "@/components/EmptyState";

export default function TransactionList() {
  const { user } = useAuth();
  const { month, year, prev, next } = useMonthNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  // começa true: com false o EmptyState piscava antes do primeiro fetch
  const [isLoading, setIsLoading] = useState(true);

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

  // categorias não dependem de mês/ano — busca só uma vez, pro CategoryPicker
  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const edit = useInlineTransactionEdit(loadTransactions);

  return (
    <div className="p-4 pb-24">
      <MonthPicker month={month} year={year} onPrev={prev} onNext={next} />

      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">Carregando...</p>
      ) : transactions.length === 0 ? (
        <EmptyState message="Nenhuma transação neste mês." />
      ) : (
        <ul className="mt-4 space-y-2">
          {transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              currentUserId={user!.id}
              edit={edit}
            />
          ))}
        </ul>
      )}

      <TransactionEditDialogs
        edit={edit}
        transactions={transactions}
        categories={categories}
      />
    </div>
  );
}
