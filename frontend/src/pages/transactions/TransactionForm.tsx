import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import { ArrowLeft, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  updateTransaction,
  type Transaction,
} from "@/services/transactions";
import { getCategories, type Category } from "@/services/categories";
import CategoryBadge from "@/components/CategoryBadge";

const NO_CATEGORY = "none";
const AMOUNT_CHIPS = [50, 100, 250, 500];

const transactionFormSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]),
  amount: z
    .string()
    .min(1, "Informe o valor")
    .refine((v) => !isNaN(parseFloat(v.replace(",", "."))), "Valor inválido")
    .refine(
      (v) => parseFloat(v.replace(",", ".")) > 0,
      "Deve ser maior que zero",
    ),
  description: z.string().max(255, "Nota muito longa"),
  categoryId: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export default function TransactionForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState<Transaction | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "EXPENSE",
      amount: "",
      description: "",
      categoryId: NO_CATEGORY,
    },
  });

  const type = useWatch({ control: form.control, name: "type" });
  const categoryId = useWatch({ control: form.control, name: "categoryId" });
  const amount = useWatch({ control: form.control, name: "amount" });

  const categoriesForType = categories.filter((c) => c.type === type);

  // categorias só precisam ser carregadas uma vez
  useEffect(() => {
    async function fetchCategories() {
      const data = await getCategories();
      setCategories(data);
    }
    fetchCategories();
  }, []);

  // categoria escolhida pode não existir mais pro tipo selecionado — volta pra "sem categoria"
  useEffect(() => {
    if (categoryId === NO_CATEGORY || categories.length === 0) return;
    const stillValid = categories.some(
      (c) => c.id === categoryId && c.type === type,
    );
    if (!stillValid) {
      form.setValue("categoryId", NO_CATEGORY);
    }
  }, [type, categories, categoryId, form]);

  // busca a transação e já popula o form quando os dados chegam
  useEffect(() => {
    async function fetchTransaction() {
      if (!id) return;
      const data = await getTransaction(id);
      setTransaction(data);
      form.reset({
        type: data.type,
        amount: data.amount,
        description: data.description,
        categoryId: data.categoryId ?? NO_CATEGORY,
      });
    }
    fetchTransaction();
  }, [id, form]);

  async function onSubmit(data: TransactionFormValues) {
    try {
      const payload = {
        ...data,
        amount: parseFloat(data.amount.replace(",", ".")),
        categoryId:
          data.categoryId === NO_CATEGORY
            ? transaction
              ? null
              : undefined
            : data.categoryId,
      };
      if (!transaction) {
        await createTransaction(payload);
        toast.success("Transação criada com sucesso!");
      } else {
        await updateTransaction(transaction.id, payload);
        toast.success("Transação atualizada com sucesso!");
      }
      navigate("/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.error("Categoria inválida. Selecione outra.");
      } else {
        toast.error("Erro ao salvar transação. Tente novamente.");
      }
    }
  }

  async function handleDelete() {
    try {
      if (!transaction) return;
      await deleteTransaction(transaction.id);
      toast.success("Transação deletada com sucesso!");
      navigate("/dashboard");
    } catch {
      toast.error("Erro ao deletar transação. Tente novamente.");
    }
  }

  return (
    <div className="px-4 py-4 md:mx-auto md:max-w-sm">
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          render={<Link to="/transactions" />}
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-lg font-semibold">
          {isEditMode ? "Editar lançamento" : "Novo lançamento"}
        </h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Toggle Gasto / Ganho */}
        <div className="grid grid-cols-2 gap-2 rounded-xl border p-0.5 bg-muted">
          <button
            type="button"
            onClick={() =>
              form.setValue("type", "EXPENSE", { shouldValidate: true })
            }
            className={cn(
              "rounded-lg py-2 text-sm font-extrabold transition-colors",
              type === "EXPENSE"
                ? "bg-expense text-white"
                : "text-muted-foreground",
            )}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() =>
              form.setValue("type", "INCOME", { shouldValidate: true })
            }
            className={cn(
              "rounded-lg py-2 text-sm font-extrabold transition-colors",
              type === "INCOME"
                ? "bg-income text-white"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            Ganho
          </button>
        </div>

        {/* Valor grande + chips de valor rápido */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Valor</p>
          <div className="flex items-center justify-center gap-1">
            <span
              className={cn(
                "text-[42px] font-bold",
                type === "EXPENSE" ? "text-expense" : "text-income",
              )}
            >
              R$
            </span>
            <Input
              {...form.register("amount")}
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              className={cn(
                "border-none bg-transparent w-auto py-0 px-2 text-[42px] font-bold shadow-none focus-visible:ring-0",
                type === "EXPENSE" ? "text-expense" : "text-income",
              )}
              size={Math.max(amount?.length ?? 0, 4)}
            />
          </div>
          {form.formState.errors.amount?.message && (
            <p className="text-center text-sm text-destructive">
              {form.formState.errors.amount.message}
            </p>
          )}
          <div className="flex justify-center gap-2">
            {AMOUNT_CHIPS.map((value) => {
              const isSelected =
                parseFloat(amount?.replace(",", ".")) === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    form.setValue(
                      "amount",
                      value.toFixed(2).replace(".", ","),
                      {
                        shouldValidate: true,
                      },
                    )
                  }
                  className={cn(
                    "rounded-lg border px-4 py-2 mt-5 bg-muted text-xs transition-colors",
                    isSelected
                      ? type === "EXPENSE"
                        ? "border-expense bg-expense text-white"
                        : "border-income bg-income text-white"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  R$ {value}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid de categorias */}
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Categoria
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() =>
                form.setValue("categoryId", NO_CATEGORY, {
                  shouldValidate: true,
                })
              }
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors",
                categoryId === NO_CATEGORY
                  ? "border-primary bg-primary/10"
                  : "hover:bg-muted",
              )}
            >
              <span className="size-4 rounded-full bg-muted-foreground/30" />
              Sem categoria
            </button>
            {categoriesForType.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  form.setValue("categoryId", category.id, {
                    shouldValidate: true,
                  })
                }
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors",
                  categoryId === category.id
                    ? "border-primary bg-primary/10"
                    : "hover:bg-muted",
                )}
              >
                <CategoryBadge
                  icon={category.icon}
                  color={category.color}
                  size={28}
                />
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Input
            {...form.register("description")}
            id="description"
            type="text"
            placeholder="Adicionar uma nota (opcional)"
            aria-label="Nota"
          />
          {form.formState.errors.description?.message && (
            <p className="text-sm text-destructive">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pb-8">
          {isEditMode && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmDeleteOpen(true)}
            >
              <Trash2 size={16} /> Excluir
            </Button>
          )}
          <Button
            type="submit"
            className={cn(
              "flex-1 text-white",
              type === "EXPENSE"
                ? "bg-expense hover:bg-expense/90"
                : "bg-income hover:bg-income/90",
            )}
          >
            Salvar lançamento
          </Button>
        </div>
      </form>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
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
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
