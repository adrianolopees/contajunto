import type { Category } from "@/services/categories";
import type { GroupTransaction } from "@/services/groups";
import type { Transaction } from "@/services/transactions";
import type { InlineTransactionEdit } from "@/hooks/useInlineTransactionEdit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import CategoryPicker, {
  NO_CATEGORY,
} from "@/components/transactions/CategoryPicker";
import PaymentMethodPicker from "@/components/transactions/PaymentMethodPicker";
import CurrencyInput from "@/components/CurrencyInput";

interface TransactionEditDialogsProps {
  edit: InlineTransactionEdit;
  transactions: (Transaction | GroupTransaction)[];
  categories: Category[];
}

// os 3 dialogs (categoria, forma de pagamento, exclusão) do TransactionRow —
// renderizado uma única vez por página, fora do .map() da lista, já que o
// hook levantado garante no máximo uma transação em edição por vez
export default function TransactionEditDialogs({
  edit,
  transactions,
  categories,
}: TransactionEditDialogsProps) {
  const categoryPickerTransaction = transactions.find(
    (t) => t.id === edit.categoryPickerFor,
  );
  const paymentPickerTransaction = transactions.find(
    (t) => t.id === edit.paymentPickerFor,
  );

  return (
    <>
      {/* mesmo padrão dos outros dialogs curtos (pagamento/exclusão) — antes
          essa edição era inline na própria linha, mas ficou apertada e
          inconsistente com os outros campos, que já abrem overlay */}
      <Dialog
        open={edit.editingAmountId !== null}
        onOpenChange={(open) => !open && edit.cancelEditAmount()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar valor</DialogTitle>
          </DialogHeader>
          <CurrencyInput
            value={edit.amountDraft}
            onChange={edit.setAmountDraft}
            autoFocus
            className="text-center text-2xl font-bold"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={edit.cancelEditAmount}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() =>
                edit.editingAmountId && edit.saveAmount(edit.editingAmountId)
              }
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet (menu inferior) em vez de Dialog: a lista de categorias pode
          ficar grande (vários grupos), e um Dialog centralizado não dá
          espaço suficiente de tela pra ela rolar — o Sheet ocupa a maior
          parte da altura da viewport (ver max-h-[85dvh] no sheet.tsx) */}
      <Sheet
        open={edit.categoryPickerFor !== null}
        onOpenChange={(open) => !open && edit.setCategoryPickerFor(null)}
      >
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Trocar categoria</SheetTitle>
          </SheetHeader>
          {categoryPickerTransaction && (
            <div className="px-4 pb-4">
              <CategoryPicker
                categories={categories}
                type={categoryPickerTransaction.type}
                value={categoryPickerTransaction.categoryId ?? NO_CATEGORY}
                onSelect={(newCategoryId) =>
                  edit.changeCategory(categoryPickerTransaction.id, newCategoryId)
                }
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={edit.paymentPickerFor !== null}
        onOpenChange={(open) => !open && edit.setPaymentPickerFor(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar forma de pagamento</DialogTitle>
          </DialogHeader>
          {paymentPickerTransaction && (
            <PaymentMethodPicker
              value={paymentPickerTransaction.paymentMethod ?? "DEBIT"}
              onSelect={(method) =>
                edit.changePaymentMethod(paymentPickerTransaction.id, method)
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={edit.deleteConfirmFor !== null}
        onOpenChange={(open) => !open && edit.setDeleteConfirmFor(null)}
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
              onClick={() => edit.setDeleteConfirmFor(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                edit.deleteConfirmFor &&
                edit.confirmDelete(edit.deleteConfirmFor)
              }
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
