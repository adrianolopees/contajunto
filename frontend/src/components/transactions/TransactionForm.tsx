import type { Category } from "@/services/categories";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
  type Transaction,
} from "@/services/transactions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";

const TransactionFormShchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]),
  amount: z
    .string()
    .min(1, "Informe o valor")
    .refine((v) => !isNaN(parseFloat(v.replace(",", "."))), "Valor inválido")
    .refine(
      (v) => parseFloat(v.replace(",", ".")) > 0,
      "Deve ser maior que zero",
    ),
  description: z.string().min(4, "Mínimo 4 caracteres"),
  categoryId: z.string().optional(),
});

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (opne: boolean) => void;
  transaction?: Transaction;
  categories: Category[];
  onSuccess: () => void;
}

export default function TransactionForm({
  open,
  onOpenChange,
  transaction,
  categories,
  onSuccess,
}: TransactionFormProps) {
  const form = useForm<z.infer<typeof TransactionFormShchema>>({
    resolver: zodResolver(TransactionFormShchema),
    defaultValues: {
      type: transaction?.type ?? "EXPENSE",
      amount: transaction?.amount ?? "",
      description: transaction?.description ?? "",
      categoryId: transaction?.categoryId ?? "",
    },
  });
  useEffect(() => {
    form.reset({
      type: transaction?.type ?? "EXPENSE",
      amount: transaction?.amount ?? "",
      description: transaction?.description ?? "",
      categoryId: transaction?.categoryId ?? "",
    });
  }, [transaction, form]);

  async function onSubmit(data: z.infer<typeof TransactionFormShchema>) {
    try {
      const payload = {
        ...data,
        amount: parseFloat(data.amount.replace(",", ".")),
        categoryId: data.categoryId || undefined,
      };
      if (!transaction) {
        await createTransaction(payload);
        toast.success("Transação criada com sucesso!");
      } else {
        await updateTransaction(transaction.id, payload);
        toast.success("Transação atualizada com sucesso!");
      }
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Mensagem de erro");
    }
  }

  async function handleDelete() {
    try {
      if (!transaction) return;
      await deleteTransaction(transaction.id);
      toast.success("Transação deletada com sucesso!");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Mensagem de erro");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar transação" : "Nova transação"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue>
                    {field.value === "EXPENSE" ? "Despesa" : "Receita"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Despesa</SelectItem>
                  <SelectItem value="INCOME">Receita</SelectItem>
                </SelectContent>
              </Select>
            )}
          ></Controller>
          <Label htmlFor="amount">Valor</Label>
          <Input
            {...form.register("amount")}
            id="amount"
            type="text"
            placeholder="0,00"
            inputMode="decimal"
          />
          {form.formState.errors.amount?.message && (
            <p className="text-sm text-destructive">
              {form.formState.errors.amount.message}
            </p>
          )}
          <Label htmlFor="description">Descrição</Label>
          <Input
            {...form.register("description")}
            id="description"
            type="text"
            placeholder="descrição"
          />
          {form.formState.errors.description?.message && (
            <p className="text-sm text-destructive">
              {form.formState.errors.description.message}
            </p>
          )}
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria">
                    {categories.find((c) => c.id === field.value)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          ></Controller>
          <div className="flex justify-between">
            {transaction && (
              <Button
                variant="destructive"
                type="button"
                onClick={handleDelete}
              >
                <Trash2 size={16} /> Excluir
              </Button>
            )}
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
