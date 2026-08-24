import { updateCategory, type Category } from "@/services/categories";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import CategoryBadge from "@/components/CategoryBadge";

const EditCategoryFormSchema = z.object({
  monthlyLimit: z
    .string()
    .optional()
    .refine(
      (v) => !v || !isNaN(parseFloat(v.replace(",", "."))),
      "Limite inválido",
    )
    .refine(
      (v) => !v || parseFloat(v.replace(",", ".")) > 0,
      "Deve ser maior que zero",
    ),
});

type EditCategoryFormValues = z.infer<typeof EditCategoryFormSchema>;

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
  onSuccess: () => void;
}

export default function CategoryForm({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryFormProps) {
  const form = useForm<EditCategoryFormValues>({
    resolver: zodResolver(EditCategoryFormSchema),
  });

  useEffect(() => {
    form.reset({ monthlyLimit: category.monthlyLimit ?? "" });
  }, [category, form]);

  async function onSubmit(data: EditCategoryFormValues) {
    try {
      const monthlyLimit = data.monthlyLimit
        ? parseFloat(data.monthlyLimit.replace(",", "."))
        : null;
      await updateCategory(category.id, { monthlyLimit });
      toast.success("Categoria atualizada com sucesso!");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Erro ao salvar categoria. Tente novamente.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar categoria</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <CategoryBadge icon={category.icon} color={category.color} size={40} />
          <div>
            <p className="font-medium">{category.name}</p>
            <p className="text-xs text-muted-foreground">
              {category.group.name}
            </p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="monthlyLimit">Limite mensal (opcional)</Label>
            <Input
              {...form.register("monthlyLimit")}
              id="monthlyLimit"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
            />
            {form.formState.errors.monthlyLimit?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.monthlyLimit.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
