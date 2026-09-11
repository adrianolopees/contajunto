import { Pencil, Repeat, Trash2 } from "lucide-react";
import type { GroupTransaction } from "@/services/groups";
import type { Transaction } from "@/services/transactions";
import type { InlineTransactionEdit } from "@/hooks/useInlineTransactionEdit";
import { PAYMENT_METHODS } from "@/lib/paymentMethods";
import { formatCurrency, formatTransactionTimestamp } from "@/lib/format";

interface TransactionRowProps {
  transaction: Transaction | GroupTransaction;
  currentUserId: string;
  edit: InlineTransactionEdit;
}

// linha de transação com edição inline (valor, categoria, forma de
// pagamento, exclusão) — única fonte de verdade de "essa transação pode ser
// editada aqui?": quando não é do usuário logado (transação de outro membro
// do grupo), os controles somem sozinhos, sem depender de quem chama o
// componente lembrar de checar ownership antes
export default function TransactionRow({
  transaction,
  currentUserId,
  edit,
}: TransactionRowProps) {
  const isOwn = !("user" in transaction) || transaction.user.id === currentUserId;
  const paymentMeta = PAYMENT_METHODS.find(
    (m) => m.value === transaction.paymentMethod,
  );
  const PaymentIcon = paymentMeta?.icon;

  const amountClassName =
    transaction.type === "INCOME"
      ? "font-medium text-income"
      : "font-medium text-expense";

  return (
    <li className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {transaction.description || "Sem descrição"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatTransactionTimestamp(transaction.date)}
            {"user" in transaction && ` · ${transaction.user.name.split(" ")[0]}`}
          </p>
        </div>

        {isOwn ? (
          <button
            type="button"
            onClick={() => edit.startEditAmount(transaction.id, transaction.amount)}
            className="flex shrink-0 items-center gap-1"
          >
            <span className={amountClassName}>
              {transaction.type === "INCOME" ? "+" : "-"}
              {formatCurrency(Number(transaction.amount))}
            </span>
            <Pencil size={12} className="text-muted-foreground" />
          </button>
        ) : (
          <span className={`shrink-0 ${amountClassName}`}>
            {transaction.type === "INCOME" ? "+" : "-"}
            {formatCurrency(Number(transaction.amount))}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {isOwn ? (
          <button
            type="button"
            onClick={() => edit.setCategoryPickerFor(transaction.id)}
            className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            <Repeat size={12} />
            {transaction.category?.name ?? "Sem categoria"}
          </button>
        ) : (
          <span className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-muted-foreground">
            {transaction.category?.name ?? "Sem categoria"}
          </span>
        )}

        {transaction.type === "EXPENSE" &&
          (isOwn ? (
            <button
              type="button"
              onClick={() => edit.setPaymentPickerFor(transaction.id)}
              className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
            >
              {PaymentIcon && <PaymentIcon size={12} />}
              {paymentMeta?.label ?? "Forma de pagamento"}
            </button>
          ) : (
            paymentMeta && (
              <span className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-muted-foreground">
                {PaymentIcon && <PaymentIcon size={12} />}
                {paymentMeta.label}
              </span>
            )
          ))}

        {isOwn && (
          <button
            type="button"
            onClick={() => edit.setDeleteConfirmFor(transaction.id)}
            aria-label="Excluir transação"
            className="ml-auto text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </li>
  );
}
