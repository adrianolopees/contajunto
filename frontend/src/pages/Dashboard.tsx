import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  type TransactionsSummary,
  type Transaction,
  getTransactions,
  getTransactionsSummary,
} from "@/services/transactions";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import MonthPicker from "@/components/MonthPicker";
import { useMonthNavigation } from "@/hooks/useMonthNavigation";
import { formatCurrency } from "@/lib/format";
import EmptyState from "@/components/EmptyState";

export default function Dashboard() {
  const { month, year, prev, next } = useMonthNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [transactions, summary] = await Promise.all([
          getTransactions({ month, year }),
          getTransactionsSummary({ month, year }),
        ]);
        setTransactions(transactions);
        setSummary(summary);
      } catch {
        toast.error("Não foi possível carregar. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [month, year]);

  return (
    <div className="px-4 py-4 space-y-4">
      <MonthPicker month={month} year={year} onPrev={prev} onNext={next} />

      <div className="grid grid-cols-3 gap-4 ">
        <Card>
          <CardTitle>Receitas </CardTitle>
          <CardContent>{formatCurrency(summary?.income ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardTitle> Despesas</CardTitle>
          <CardContent>{formatCurrency(summary?.expense ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardTitle> Saldo</CardTitle>

          <CardContent>{formatCurrency(summary?.balance ?? 0)}</CardContent>
        </Card>
      </div>
      <div>
        <h2>Transações</h2>
        {isLoading ? (
          <p>Carregando...</p>
        ) : transactions.length === 0 ? (
          <EmptyState message="Nenhuma transação neste mes." />
        ) : (
          <ul>
            {transactions.map((t) => (
              <li key={t.id}>
                {t.description} — {t.amount}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
