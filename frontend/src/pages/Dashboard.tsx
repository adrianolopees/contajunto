import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  type TransactionsSummary,
  type Transaction,
  type CategorySpending,
  type CategorySpendingLeaf,
  getTransactions,
  getTransactionsSummary,
  getCategorySpending,
} from "@/services/transactions";
import {
  getGroup,
  getGroupTransactions,
  getGroupTransactionsSummary,
  getGroupCategorySpending,
  getGroupMemberSpending,
  type Group,
  type GroupTransaction,
  type MemberSpending,
} from "@/services/groups";
import type { CategoryGroup } from "@/services/categories";
import { Card, CardContent } from "@/components/ui/card";
import MonthPicker from "@/components/MonthPicker";
import CategoryBadge from "@/components/CategoryBadge";
import DonutChart from "@/components/DonutChart";
import ExpandableCategoryGroups from "@/components/categories/ExpandableCategoryGroups";
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
const UNCATEGORIZED_GROUP: CategoryGroup = {
  id: "uncategorized",
  name: "Sem categoria",
  color: UNCATEGORIZED_COLOR,
  icon: "Circle",
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function toDonutSlices(categorySpending: CategorySpending[]) {
  return categorySpending.map((item) => ({
    value: item.total,
    color: item.group?.color ?? UNCATEGORIZED_COLOR,
  }));
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
  const [categorySpending, setCategorySpending] = useState<
    CategorySpending[]
  >([]);
  const [memberSpending, setMemberSpending] = useState<MemberSpending[]>([]);
  const [expandedMemberCategoryId, setExpandedMemberCategoryId] = useState<
    string | null
  >(null);
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
        const [
          transactionsData,
          summaryData,
          categorySpendingData,
          memberSpendingData,
        ] = await Promise.all([
          getGroupTransactions({ month, year }),
          getGroupTransactionsSummary({ month, year }),
          getGroupCategorySpending({ month, year }),
          getGroupMemberSpending({ month, year }),
        ]);
        setTransactions(transactionsData);
        setSummary(summaryData);
        setCategorySpending(categorySpendingData);
        setMemberSpending(memberSpendingData);
      } else {
        const [transactionsData, summaryData, categorySpendingData] =
          await Promise.all([
            getTransactions({ month, year }),
            getTransactionsSummary({ month, year }),
            getCategorySpending({ month, year }),
          ]);
        setTransactions(transactionsData);
        setSummary(summaryData);
        setCategorySpending(categorySpendingData);
        setMemberSpending([]);
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

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-4 px-4 py-4 pb-24">
      <div>
        <h1 className="text-xl font-semibold">
          {greeting()}, {user?.name.split(" ")[0]}
        </h1>
      </div>
      <MonthPicker month={month} year={year} onPrev={prev} onNext={next} />

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
        <div className="grid grid-cols-2 gap-2">
          {group.users.map((member) => {
            const memberTotal =
              memberSpending.find((m) => m.userId === member.id)?.total ?? 0;
            return (
              <div
                key={member.id}
                className="flex items-center gap-2 rounded-xl border p-2"
              >
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: getMemberColor(member.id) }}
                >
                  {member.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-muted-foreground">
                    {member.id === user?.id
                      ? "Você"
                      : member.name.split(" ")[0]}
                  </p>
                  <p className="truncate text-sm font-semibold text-expense">
                    -{formatCurrency(memberTotal)}
                  </p>
                </div>
              </div>
            );
          })}
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
          <div className="space-y-4">
            <DonutChart
              data={toDonutSlices(categorySpending)}
              size={220}
              centerLabel="Total"
              centerValue={formatCurrency(
                categorySpending.reduce((sum, c) => sum + c.total, 0),
              )}
            />
            <ExpandableCategoryGroups
              groups={categorySpending.map((item) => ({
                group: item.group ?? UNCATEGORIZED_GROUP,
                items: item.categories,
                total: item.total,
              }))}
              totalForPercentage={categorySpending.reduce(
                (sum, c) => sum + c.total,
                0,
              )}
              getItemKey={(item) => item.id}
              renderItem={(item: CategorySpendingLeaf) => {
                const isOwn = view === "personal" || item.userId === user?.id;

                if (isOwn) {
                  return (
                    <Link
                      to={`/categories/${item.id}`}
                      className="flex items-center gap-3 p-3 pl-12 text-sm"
                    >
                      <CategoryBadge
                        icon={item.icon}
                        color={item.color}
                        size={24}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {item.name}
                      </span>
                      <span className="shrink-0 font-medium">
                        {formatCurrency(item.total)}
                      </span>
                    </Link>
                  );
                }

                const isMemberExpanded =
                  expandedMemberCategoryId === item.id;
                const ownerName = group?.users
                  .find((member) => member.id === item.userId)
                  ?.name.split(" ")[0];
                const memberTransactions = transactions.filter(
                  (t) => t.category?.id === item.id,
                );

                return (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMemberCategoryId(
                          isMemberExpanded ? null : item.id,
                        )
                      }
                      className="flex w-full items-center gap-3 p-3 pl-12 text-left text-sm"
                    >
                      <CategoryBadge
                        icon={item.icon}
                        color={item.color}
                        size={24}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{item.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {ownerName}
                        </p>
                      </div>
                      <span className="shrink-0 font-medium">
                        {formatCurrency(item.total)}
                      </span>
                      {isMemberExpanded ? (
                        <ChevronUp
                          size={14}
                          className="shrink-0 text-muted-foreground"
                        />
                      ) : (
                        <ChevronDown
                          size={14}
                          className="shrink-0 text-muted-foreground"
                        />
                      )}
                    </button>
                    {isMemberExpanded && (
                      <ul className="divide-y border-t bg-muted/30">
                        {memberTransactions.map((t) => (
                          <li
                            key={t.id}
                            className="flex items-center justify-between gap-3 p-3 pl-16 text-xs"
                          >
                            <span className="min-w-0 flex-1 truncate text-muted-foreground">
                              {t.description || "Sem descrição"} ·{" "}
                              {formatRelativeDay(t.date)}
                            </span>
                            <span className="shrink-0 font-medium text-expense">
                              -{formatCurrency(Number(t.amount))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                );
              }}
            />
          </div>
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
