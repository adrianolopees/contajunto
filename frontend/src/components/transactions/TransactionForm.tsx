import type { Category } from "@/services/categories";
import {
  createTransaction,
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

const TransactionFormShchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]),
  amount: z.string(),
  // min(4) espelha a validação do backend — evita 400 antes de bater na rede
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

  async function onSubmit(data: z.infer<typeof TransactionFormShchema>) {
    try {
      if (!transaction) {
        // categoryId: "" quando vazio — converte pra undefined antes de enviar ao backend
        const payload = { ...data, amount: parseFloat(data.amount), categoryId: data.categoryId || undefined };
        await createTransaction(payload);
        toast.success("Transação criada com sucesso!");
        onOpenChange(false);
        onSuccess();
      } else {
        // categoryId: "" quando vazio — converte pra undefined antes de enviar ao backend
        const payload = { ...data, amount: parseFloat(data.amount), categoryId: data.categoryId || undefined };
        await updateTransaction(transaction.id, payload);
        toast.success("Transação atualizada com sucesso!");
        onOpenChange(false);
        onSuccess();
      }
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
                  <SelectValue />
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
            placeholder="valor"
          />
          <Label htmlFor="description">Descrição</Label>
          <Input
            {...form.register("description")}
            id="description"
            type="text"
            placeholder="descrição"
          />
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
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
          <button type="submit">Salvar</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
