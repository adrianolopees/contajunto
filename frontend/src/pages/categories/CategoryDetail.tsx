import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Check, Pencil, Repeat, Trash2, X } from "lucide-react";
import { getCategories, type Category } from "@/services/categories";
import {
  deleteTransaction,
  getTransactions,
  updateTransaction,
  type PaymentMethod,
  type Transaction,
} from "@/services/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CategoryPicker, {
  NO_CATEGORY,
} from "@/components/transactions/CategoryPicker";
import PaymentMethodPicker from "@/components/transactions/PaymentMethodPicker";
import { PAYMENT_METHODS } from "@/lib/paymentMethods";
import CategoryBadge from "@/components/CategoryBadge";
import EmptyState from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { formatCurrency, formatTransactionTimestamp } from "@/lib/format";

function previousMonth(month: number, year: number) {
  return month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState<Category | undefined>();
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [currentTransactions, setCurrentTransactions] = useState<
    Transaction[]
  >([]);
  const [previousTotal, setPreviousTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // edição inline: qual transação está em cada modo, nunca mais de uma por vez
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [amountDraft, setAmountDraft] = useState("");
  const [categoryPickerFor, setCategoryPickerFor] = useState<string | null>(
    null,
  );
  const [paymentPickerFor, setPaymentPickerFor] = useState<string | null>(
    null,
  );
  const [deleteConfirmFor, setDeleteConfirmFor] = useState<string | null>(
    null,
  );

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const prev = previousMonth(month, year);

      const [categories, currentMonthTx, previousMonthTx] = await Promise.all([
        getCategories(),
        getTransactions({ month, year }),
        getTransactions({ month: prev.month, year: prev.year }),
      ]);

      const found = categories.find((c) => c.id === id);
      if (!found) {
        navigate("/dashboard");
        return;
      }
      setCategory(found);
      setAllCategories(categories);
      setCurrentTransactions(
        currentMonthTx.filter((t) => t.category?.id === id),
      );
      setPreviousTotal(
        previousMonthTx
          .filter((t) => t.category?.id === id)
          .reduce((sum, t) => sum + Number(t.amount), 0),
      );
    } catch {
      toast.error("Não foi possível carregar a categoria.");
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function startEditAmount(transaction: Transaction) {
    setEditingAmountId(transaction.id);
    setAmountDraft(transaction.amount);
  }

  async function saveAmount(transactionId: string) {
    const parsed = parseFloat(amountDraft.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Valor inválido.");
      return;
    }
    try {
      await updateTransaction(transactionId, { amount: parsed });
      toast.success("Valor atualizado!");
      setEditingAmountId(null);
      loadData();
    } catch {
      toast.error("Erro ao atualizar valor.");
    }
  }

  async function handleChangeCategory(
    transactionId: string,
    newCategoryId: string,
  ) {
    try {
      await updateTransaction(transactionId, {
        categoryId: newCategoryId === NO_CATEGORY ? null : newCategoryId,
      });
      toast.success("Categoria atualizada!");
      setCategoryPickerFor(null);
      loadData();
    } catch {
      toast.error("Erro ao atualizar categoria.");
    }
  }

  async function handleChangePaymentMethod(
    transactionId: string,
    method: PaymentMethod,
  ) {
    try {
      await updateTransaction(transactionId, {
        paymentMethod: method,
        // cartão só vale com crédito — trocando pra outro método, limpa o cartão
        cardId: method === "CREDIT" ? undefined : null,
      });
      toast.success("Forma de pagamento atualizada!");
      setPaymentPickerFor(null);
      loadData();
    } catch {
      toast.error("Erro ao atualizar forma de pagamento.");
    }
  }

  async function handleDeleteConfirmed(transactionId: string) {
    try {
      await deleteTransaction(transactionId);
      toast.success("Transação excluída!");
      setDeleteConfirmFor(null);
      loadData();
    } catch {
      toast.error("Erro ao excluir transação.");
    }
  }

  if (isLoading || !category) {
    return (
      <div className="p-4">
        <p className="py-8 text-center text-muted-foreground">
          Carregando...
        </p>
      </div>
    );
  }

  const total = currentTransactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0,
  );

  const today = new Date();
  const mediaDiaria = total / today.getDate();
  const compras = currentTransactions.length;
  const vsLastMonth =
    previousTotal > 0
      ? Math.round(((total - previousTotal) / previousTotal) * 100)
      : total > 0
        ? 100
        : 0;

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(today);
    day.setDate(day.getDate() - (6 - i));
    const dayTotal = currentTransactions
      .filter((t) => isSameDay(new Date(t.date), day))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return dayTotal;
  });
  const maxDay = Math.max(...last7Days, 1);

  const categoryPickerTransaction = currentTransactions.find(
    (t) => t.id === categoryPickerFor,
  );
  const paymentPickerTransaction = currentTransactions.find(
    (t) => t.id === paymentPickerFor,
  );

  return (
    <div className="space-y-4 px-4 py-4 pb-24">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          render={<Link to="/dashboard" />}
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-lg font-semibold">{category.name}</h1>
      </div>

      <div className="rounded-xl border p-4">
        <div className="flex items-center gap-3">
          <CategoryBadge icon={category.icon} color={category.color} size={44} />
          <p className="text-2xl font-bold">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">Média diária</p>
          <p className="font-semibold">{formatCurrency(mediaDiaria)}</p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">Compras</p>
          <p className="font-semibold">{compras}</p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">vs. mês ant.</p>
          <p
            className={cn(
              "font-semibold",
              vsLastMonth > 0
                ? "text-expense"
                : vsLastMonth < 0
                  ? "text-income"
                  : "",
            )}
          >
            {vsLastMonth > 0 ? "+" : ""}
            {vsLastMonth}%
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Últimos 7 dias
        </h2>
        <div className="flex h-16 items-end gap-2">
          {last7Days.map((value, i) => (
            <div
              key={i}
              className="flex-1 rounded-md"
              style={{
                height: `${Math.max((value / maxDay) * 100, 8)}%`,
                backgroundColor: category.color,
                opacity: value === 0 ? 0.25 : 1,
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-medium">Transações</h2>
        {currentTransactions.length === 0 ? (
          <EmptyState message="Nenhuma transação nesta categoria." />
        ) : (
          <ul className="space-y-2">
            {currentTransactions.map((transaction) => {
              const paymentMeta = PAYMENT_METHODS.find(
                (m) => m.value === transaction.paymentMethod,
              );
              const PaymentIcon = paymentMeta?.icon;
              return (
                <li key={transaction.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {transaction.description || "Sem descrição"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTransactionTimestamp(transaction.date)}
                      </p>
                    </div>

                    {editingAmountId === transaction.id ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <Input
                          value={amountDraft}
                          onChange={(e) => setAmountDraft(e.target.value)}
                          type="text"
                          inputMode="decimal"
                          autoFocus
                          className="w-20 py-1 text-right text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => saveAmount(transaction.id)}
                          aria-label="Salvar valor"
                          className="text-income"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAmountId(null)}
                          aria-label="Cancelar"
                          className="text-muted-foreground"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditAmount(transaction)}
                        className="flex shrink-0 items-center gap-1"
                      >
                        <span
                          className={
                            transaction.type === "INCOME"
                              ? "font-medium text-income"
                              : "font-medium text-expense"
                          }
                        >
                          {transaction.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(Number(transaction.amount))}
                        </span>
                        <Pencil size={12} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCategoryPickerFor(transaction.id)}
                      className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                    >
                      <Repeat size={12} />
                      {transaction.category?.name ?? "Sem categoria"}
                    </button>

                    {transaction.type === "EXPENSE" && (
                      <button
                        type="button"
                        onClick={() => setPaymentPickerFor(transaction.id)}
                        className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                      >
                        {PaymentIcon && <PaymentIcon size={12} />}
                        {paymentMeta?.label ?? "Forma de pagamento"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmFor(transaction.id)}
                      aria-label="Excluir transação"
                      className="ml-auto text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog
        open={categoryPickerFor !== null}
        onOpenChange={(open) => !open && setCategoryPickerFor(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar categoria</DialogTitle>
          </DialogHeader>
          {categoryPickerTransaction && (
            <CategoryPicker
              categories={allCategories}
              type={categoryPickerTransaction.type}
              value={categoryPickerTransaction.categoryId ?? NO_CATEGORY}
              onSelect={(newCategoryId) =>
                handleChangeCategory(categoryPickerTransaction.id, newCategoryId)
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={paymentPickerFor !== null}
        onOpenChange={(open) => !open && setPaymentPickerFor(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forma de pagamento</DialogTitle>
          </DialogHeader>
          {paymentPickerTransaction && (
            <PaymentMethodPicker
              value={paymentPickerTransaction.paymentMethod ?? "DEBIT"}
              onSelect={(method) =>
                handleChangePaymentMethod(paymentPickerTransaction.id, method)
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirmFor !== null}
        onOpenChange={(open) => !open && setDeleteConfirmFor(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir transação?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Essa ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmFor(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                deleteConfirmFor && handleDeleteConfirmed(deleteConfirmFor)
              }
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
