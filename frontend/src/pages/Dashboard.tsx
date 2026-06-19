import { useEffect, useState } from "react";
import {
  type TransactionsSummary,
  type Transaction,
  getTransactions,
  getTransactionsSummary,
} from "@/services/transactions";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionsSummary | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [transactions, summary] = await Promise.all([
          getTransactions({ month, year }),
          getTransactionsSummary({ month, year }),
        ]);
        setTransactions(transactions);
        setSummary(summary);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [month, year]);

  function handlePrevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }
  function handleNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className=" flex items-center justify-between  py-2">
        <button onClick={handlePrevMonth}>{"<"}</button>
        <span>
          {new Date(year, month - 1).toLocaleString("pt-BR", { month: "long" })}{" "}
          {year}
        </span>
        <button onClick={handleNextMonth}>{">"}</button>
      </div>

      <div className="grid grid-cols-3 gap-4 ">
        <Card>
          <CardTitle>Receitas </CardTitle>
          <CardContent>
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(summary?.income ?? 0)}
          </CardContent>
        </Card>
        <Card>
          <CardTitle> Despesas</CardTitle>
          <CardContent>
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(summary?.expense ?? 0)}
          </CardContent>
        </Card>
        <Card>
          <CardTitle> Saldo</CardTitle>

          <CardContent>
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(summary?.balance ?? 0)}
          </CardContent>
        </Card>
      </div>
      <div>
        <h2>Transações</h2>
        {isLoading ? (
          <p>Carregando...</p>
        ) : transactions.length === 0 ? (
          <p>Nenhuma transação neste mês.</p>
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
