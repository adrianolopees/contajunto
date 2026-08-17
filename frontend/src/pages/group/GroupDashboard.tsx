import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  getGroup,
  getInviteCode,
  getGroupTransactions,
  getGroupTransactionsSummary,
  getGroupMemberSpending,
  leaveGroup,
  type Group,
  type GroupTransaction,
  type MemberSpending,
} from "@/services/groups";
import type { TransactionsSummary } from "@/services/transactions";
import MonthPicker from "@/components/MonthPicker";
import CategoryBadge from "@/components/CategoryBadge";
import { useMonthNavigation } from "@/hooks/useMonthNavigation";
import {
  formatCurrency,
  formatRelativeDay,
  getMemberColor,
} from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const UNCATEGORIZED_COLOR = "var(--color-muted-foreground)";

export function GroupDashboard() {
  const { user, updateUser } = useAuth();
  const [group, setGroup] = useState<Omit<Group, "inviteCode"> | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [transactions, setTransactions] = useState<GroupTransaction[]>([]);
  const [summary, setSummary] = useState<TransactionsSummary | null>(null);
  const [memberSpending, setMemberSpending] = useState<MemberSpending[]>([]);
  const { month, year, prev, next } = useMonthNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    async function fetchGroupInfo() {
      try {
        const [groupData, code] = await Promise.all([
          getGroup(),
          getInviteCode(),
        ]);
        setGroup(groupData);
        setInviteCode(code);
      } catch {
        toast.error("Não foi possível carregar o grupo. Tente novamente.");
      }
    }
    fetchGroupInfo();
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const [transactionsData, summaryData, memberSpendingData] =
        await Promise.all([
          getGroupTransactions({ month, year }),
          getGroupTransactionsSummary({ month, year }),
          getGroupMemberSpending({ month, year }),
        ]);
      setTransactions(transactionsData);
      setSummary(summaryData);
      setMemberSpending(memberSpendingData);
    } catch {
      toast.error("Não foi possível carregar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  async function handleLeaveGroup() {
    try {
      const membership = await leaveGroup();
      updateUser(membership);
      toast.success("Você saiu do grupo");
    } catch {
      toast.error("Erro ao sair do grupo. Tente novamente.");
    } finally {
      setConfirmOpen(false);
    }
  }

  async function handleInvite() {
    await navigator.clipboard.writeText(inviteCode);
    toast.success("Código de convite copiado!");
  }

  return (
    <div className="space-y-4 px-4 py-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Família</h1>
        <Button type="button" size="sm" onClick={handleInvite}>
          + Convidar
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">Grupo compartilhado</p>
          <p className="text-lg font-semibold">{group?.name}</p>
          {group && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {group.users.map((member) => (
                  <div
                    key={member.id}
                    className="flex size-7 items-center justify-center rounded-full border-2 border-card text-[11px] font-bold text-white"
                    style={{ backgroundColor: getMemberColor(member.id) }}
                  >
                    {member.name[0]}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {group.users.length}{" "}
                {group.users.length === 1 ? "pessoa" : "pessoas"} dividindo
                despesas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none bg-primary text-summary-foreground">
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm opacity-80">Saldo do mês</p>
            <p className="text-3xl font-bold">
              {formatCurrency(summary?.balance ?? 0)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/10 p-2">
              <p className="text-xs opacity-80">Entradas</p>
              <p className="font-medium">
                +{formatCurrency(summary?.income ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-white/10 p-2">
              <p className="text-xs opacity-80">Saídas</p>
              <p className="font-medium">
                -{formatCurrency(summary?.expense ?? 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <MonthPicker month={month} year={year} onPrev={prev} onNext={next} />

      <div>
        <h2 className="mb-2 font-medium">Membros</h2>
        <ul className="space-y-2">
          {group?.users.map((member) => {
            const total =
              memberSpending.find((m) => m.userId === member.id)?.total ?? 0;
            return (
              <li
                key={member.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: getMemberColor(member.id) }}
                >
                  {member.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {member.name}
                    {member.id === user?.id && " (você)"}
                  </p>
                </div>
                <p className="text-sm font-medium text-expense">
                  -{formatCurrency(total)}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h2 className="mb-2 font-medium">Transações do grupo</h2>
        {isLoading ? (
          <p className="py-8 text-center text-muted-foreground">
            Carregando...
          </p>
        ) : transactions.length === 0 ? (
          <EmptyState message="Nenhuma transação neste mes." />
        ) : (
          <ul className="space-y-2">
            {transactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <CategoryBadge
                  icon={transaction.category?.icon ?? "Circle"}
                  color={transaction.category?.color ?? UNCATEGORIZED_COLOR}
                  size={32}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {transaction.category?.name ?? "Sem categoria"}{" "}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {transaction.description || "Sem descrição"} ·{" "}
                    {formatRelativeDay(transaction.date)} ·{" "}
                    {transaction.user.name.split(" ")[0]}
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
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        type="button"
        variant="destructive"
        className="w-full cursor-pointer"
        onClick={() => setConfirmOpen(true)}
      >
        Sair do grupo
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sair do grupo?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Você vai deixar de ver as transações compartilhadas do grupo. Se
            você for o único membro, o grupo será removido.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleLeaveGroup}
            >
              Sair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
