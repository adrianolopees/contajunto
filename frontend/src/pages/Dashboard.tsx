import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  type TransactionsSummary,
  type Transaction,
  getTransactions,
  getTransactionsSummary,
} from "@/services/transactions";
import {
  getGroup,
  getGroupTransactions,
  getGroupTransactionsSummary,
  type Group,
  type GroupTransaction,
} from "@/services/groups";
import { Card, CardContent } from "@/components/ui/card";
import MonthPicker from "@/components/MonthPicker";
import CategoryBadge from "@/components/CategoryBadge";
import DonutChart from "@/components/DonutChart";
import { useMonthNavigation } from "@/hooks/useMonthNavigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatRelativeDay,
  getMemberColor,
} from "@/lib/format";
import EmptyState from "@/components/EmptyState";

const UNCATEGORIZED_COLOR = "var(--color-muted-foreground)";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function categorySpendingFromTransactions(transactions: Transaction[]) {
  const byCategory = new Map<
    string,
    { label: string; value: number; color: string }
  >();

  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    const key = t.category?.id ?? "none";
    const existing = byCategory.get(key);
    const amount = Number(t.amount);
    if (existing) {
      existing.value += amount;
    } else {
      byCategory.set(key, {
        label: t.category?.name ?? "Sem categoria",
        value: amount,
        color: t.category?.color ?? UNCATEGORIZED_COLOR,
      });
    }
  }

  return Array.from(byCategory.values()).sort((a, b) => b.value - a.value);
}

export default function Dashboard() {
  const { user } = useAuth();
  const { month, year, prev, next } = useMonthNavigation();
  const [view, setView] = useState<"personal" | "family">("personal");
  const [group, setGroup] = useState<Omit<Group, "inviteCode"> | null>(null);
  const [transactions, setTransactions] = useState<
    (Transaction | GroupTransaction)[]
  >([]);
  const [summary, setSummary] = useState<TransactionsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.familyGroupId) return;
    async function fetchGroup() {
      try {
        const data = await getGroup();
        setGroup(data);
      } catch {
        toast.error("Não foi possível carregar o grupo.");
      }
    }
    fetchGroup();
  }, [user?.familyGroupId]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      if (view === "family") {
        const [transactionsData, summaryData] = await Promise.all([
          getGroupTransactions({ month, year }),
          getGroupTransactionsSummary({ month, year }),
        ]);
        setTransactions(transactionsData);
        setSummary(summaryData);
      } else {
        const [transactionsData, summaryData] = await Promise.all([
          getTransactions({ month, year }),
          getTransactionsSummary({ month, year }),
        ]);
        setTransactions(transactionsData);
        setSummary(summaryData);
      }
    } catch {
      toast.error("Não foi possível carregar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [view, month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const categorySpending = categorySpendingFromTransactions(transactions);
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-4 px-4 py-4 pb-24">
      <div>
        <h1 className="text-xl font-semibold">
          {greeting()}, {user?.name.split(" ")[0]}
        </h1>
      </div>

      {user?.familyGroupId && (
        <div className="grid grid-cols-2 gap-2 rounded-xl border p-1">
          <button
            type="button"
            onClick={() => setView("personal")}
            className={cn(
              "rounded-lg py-2 text-sm font-medium transition-colors",
              view === "personal"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            Minhas finanças
          </button>
          <button
            type="button"
            onClick={() => setView("family")}
            className={cn(
              "rounded-lg py-2 text-sm font-medium transition-colors",
              view === "family"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            Família
          </button>
        </div>
      )}

      <MonthPicker month={month} year={year} onPrev={prev} onNext={next} />

      <Card className="border-none bg-primary text-primary-foreground">
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm opacity-80">
              Saldo do mês{" "}
              {view === "family" ? "— Família" : "— Minhas finanças"}
            </p>
            <p className="text-3xl font-extrabold">
              {formatCurrency(summary?.balance ?? 0)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/10 p-2">
              <p className="text-xs opacity-80">Entradas</p>
              <p className="font-extrabold ">
                +{formatCurrency(summary?.income ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-white/10 p-2">
              <p className="text-xs opacity-80">Saídas</p>
              <p className="font-extrabold">
                -{formatCurrency(summary?.expense ?? 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {view === "family" && group && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex -space-x-2">
            {group.users.map((member) => (
              <div
                key={member.id}
                className="flex size-7 items-center justify-center rounded-full border-2 border-background text-[11px] font-bold text-white"
                style={{ backgroundColor: getMemberColor(member.id) }}
              >
                {member.name[0]}
              </div>
            ))}
          </div>
          <p className="truncate">
            <span className="font-medium text-foreground">
              {group.users.map((m) => m.name.split(" ")[0]).join(", ")}
            </span>{" "}
            dividindo essa conta
          </p>
        </div>
      )}

      <div>
        <h2 className="mb-3 font-extrabold">Gastos por categoria</h2>
        {isLoading ? (
          <p className="py-4 text-center text-muted-foreground">
            Carregando...
          </p>
        ) : categorySpending.length === 0 ? (
          <EmptyState message="Nenhum gasto neste mês." />
        ) : (
          <DonutChart
            data={categorySpending}
            centerLabel="Total"
            centerValue={formatCurrency(
              categorySpending.reduce((sum, c) => sum + c.value, 0),
            )}
          />
        )}
      </div>

      <div>
        <h2 className="mb-3 font-extrabold">Últimos lançamentos</h2>
        {isLoading ? (
          <p className="py-4 text-center text-muted-foreground">
            Carregando...
          </p>
        ) : recentTransactions.length === 0 ? (
          <EmptyState message="Nenhuma transação neste mês." />
        ) : (
          <ul>
            {recentTransactions.map((transaction) => (
              <li key={transaction.id}>
                <Link
                  to={`/transactions/${transaction.id}/edit`}
                  className="flex items-center gap-3 py-3"
                >
                  <CategoryBadge
                    icon={transaction.category?.icon ?? "Circle"}
                    color={transaction.category?.color ?? UNCATEGORIZED_COLOR}
                    size={32}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {transaction.description || "Sem descrição"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {transaction.category?.name ?? "Sem categoria"} ·{" "}
                      {formatRelativeDay(transaction.date)}
                      {"user" in transaction &&
                        ` · ${transaction.user.name.split(" ")[0]}`}
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
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
