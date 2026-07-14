import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  getGroup,
  getInviteCode,
  getGroupTransactions,
  getGroupTransactionsSummary,
  leaveGroup,
  type Group,
} from "@/services/groups";
import type { Transaction, TransactionsSummary } from "@/services/transactions";
import MonthPicker from "@/components/MonthPicker";
import { useMonthNavigation } from "@/hooks/useMonthNavigation";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function GroupDashboard() {
  const { user, updateUser } = useAuth();
  const [group, setGroup] = useState<Omit<Group, "inviteCode"> | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionsSummary | null>(null);
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
      const [transactionsData, summaryData] = await Promise.all([
        getGroupTransactions({ month, year }),
        getGroupTransactionsSummary({ month, year }),
      ]);
      setTransactions(transactionsData);
      setSummary(summaryData);
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

  async function handleCopyInviteCode() {
    await navigator.clipboard.writeText(inviteCode);
    toast.success("Código copiado!");
  }

  return (
    <div className="space-y-4 px-4 py-4 pb-24">
      <Card>
        <CardHeader>
          <CardTitle>{group?.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Membros</p>
            <ul className="space-y-1">
              {group?.users.map((member) => (
                <li key={member.id} className="text-sm">
                  {member.name}
                  {member.id === user?.id && " (você)"}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              Código de convite
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-muted px-2 py-1.5 text-xs">
                {inviteCode}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyInviteCode}
              >
                Copiar
              </Button>
            </div>
          </div>

          <Button
            type="button"
            variant="destructive"
            className="w-full cursor-pointer"
            onClick={() => setConfirmOpen(true)}
          >
            Sair do grupo
          </Button>
        </CardContent>
      </Card>

      <MonthPicker month={month} year={year} onPrev={prev} onNext={next} />

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardTitle>Receitas</CardTitle>
          <CardContent>{formatCurrency(summary?.income ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardTitle>Despesas</CardTitle>
          <CardContent>{formatCurrency(summary?.expense ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardTitle>Saldo</CardTitle>
          <CardContent>{formatCurrency(summary?.balance ?? 0)}</CardContent>
        </Card>
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
              <li key={transaction.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

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
