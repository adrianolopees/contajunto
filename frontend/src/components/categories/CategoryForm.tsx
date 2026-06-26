import {
  createCategory,
  deleteCategory,
  updateCategory,
  type Category,
} from "@/services/categories";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";

const CategoryFormSchema = z.object({
  name: z.string().min(2, "Minimo 2 caracateres"),
  color: z.string().min(1, "Precisa existir a cor"),
  icon: z.string().min(1, "Icone precisa existir."),
});

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  onSuccess: () => void;
}

export default function CategoryForm({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryFormProps) {
  const form = useForm<z.infer<typeof CategoryFormSchema>>({
    resolver: zodResolver(CategoryFormSchema),
  });

  useEffect(() => {
    form.reset({
      name: category?.name ?? "",
      color: category?.color ?? "",
      icon: category?.icon ?? "",
    });
  }, [category, form]);

  async function onSubmit(data: z.infer<typeof CategoryFormSchema>) {
    try {
      if (!category) {
        await createCategory(data);
        toast.success("Categoria criada com sucesso!");
      } else {
        await updateCategory(category.id, data);
        toast.success("Categoria atualizada com sucesso!");
      }
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Mensagem de erro");
    }
  }

  async function handleDelete() {
    try {
      if (!category) return;
      await deleteCategory(category.id);
      toast.success("Categoria deletada com sucesso!");
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
            {category ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Label htmlFor="name">Nome</Label>
          <Input
            {...form.register("name")}
            id="name"
            type="text"
            placeholder="Ex: Alimentação"
          />
          {form.formState.errors.name?.message && (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
          <Label htmlFor="color">Cor</Label>
          <Input
            {...form.register("color")}
            id="color"
            type="text"
            placeholder="Ex: Azul"
          />
          {form.formState.errors.color?.message && (
            <p className="text-sm text-destructive">
              {form.formState.errors.color.message}
            </p>
          )}
          <Label htmlFor="icon">Ícone</Label>
          <Input
            {...form.register("icon")}
            id="icon"
            type="text"
            placeholder="Ex: Não sei"
          />
          {form.formState.errors.icon?.message && (
            <p className="text-sm text-destructive">
              {form.formState.errors.icon.message}
            </p>
          )}
          <div className="flex justify-between">
            {category && (
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
