import { useState } from "react";
import toast from "react-hot-toast";
import {
  deleteTransaction,
  updateTransaction,
  type PaymentMethod,
} from "@/services/transactions";
import { NO_CATEGORY } from "@/components/transactions/CategoryPicker";

// edição inline de transação (valor, categoria, forma de pagamento, exclusão)
// extraído do CategoryDetail quando ganhou mais consumidores (TransactionList,
// Dashboard) — estado levantado aqui garante no máximo uma transação em cada
// modo de edição por vez na tela inteira, como já era antes da extração
export function useInlineTransactionEdit(onChanged: () => void) {
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

  function startEditAmount(transactionId: string, currentAmount: string) {
    setEditingAmountId(transactionId);
    setAmountDraft(currentAmount);
  }

  function cancelEditAmount() {
    setEditingAmountId(null);
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
      onChanged();
    } catch {
      toast.error("Erro ao atualizar valor.");
    }
  }

  async function changeCategory(transactionId: string, newCategoryId: string) {
    try {
      await updateTransaction(transactionId, {
        categoryId: newCategoryId === NO_CATEGORY ? null : newCategoryId,
      });
      toast.success("Categoria atualizada!");
      setCategoryPickerFor(null);
      onChanged();
    } catch {
      toast.error("Erro ao atualizar categoria.");
    }
  }

  async function changePaymentMethod(
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
      onChanged();
    } catch {
      toast.error("Erro ao atualizar forma de pagamento.");
    }
  }

  async function confirmDelete(transactionId: string) {
    try {
      await deleteTransaction(transactionId);
      toast.success("Transação excluída!");
      setDeleteConfirmFor(null);
      onChanged();
    } catch {
      toast.error("Erro ao excluir transação.");
    }
  }

  return {
    editingAmountId,
    amountDraft,
    setAmountDraft,
    startEditAmount,
    cancelEditAmount,
    saveAmount,
    categoryPickerFor,
    setCategoryPickerFor,
    changeCategory,
    paymentPickerFor,
    setPaymentPickerFor,
    changePaymentMethod,
    deleteConfirmFor,
    setDeleteConfirmFor,
    confirmDelete,
  };
}

export type InlineTransactionEdit = ReturnType<typeof useInlineTransactionEdit>;
