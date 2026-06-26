import {
  createCategory,
  deleteCategory,
  updateCategory,
  type Category,
} from "@/services/categories";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_OPTIONS = [
  "Utensils", "Home", "Car", "HeartPulse", "BookOpen", "Gamepad2",
  "Shirt", "RefreshCw", "Sparkles", "PawPrint", "Plane", "CreditCard",
  "Package", "Banknote", "Receipt", "Briefcase", "TrendingUp", "Plus",
  "ShoppingCart", "Coffee", "Music", "Dumbbell", "Laptop", "Baby",
  "Gift", "Fuel", "Smartphone", "Zap", "Building", "Wallet",
];

const CategoryFormSchema = z.object({
  name: z.string().min(2, "Minimo 2 caracateres"),
  color: z.string().min(1, "Precisa existir a cor"),
  icon: z.string().min(1, "Selecione um ícone"),
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

  const selectedIcon = useWatch({ control: form.control, name: "icon" });
  const selectedColor = useWatch({ control: form.control, name: "color" });

  useEffect(() => {
    form.reset({
      name: category?.name ?? "",
      color: category?.color ?? "#6b7280",
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
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
          </div>

          <div>
            <Label htmlFor="color">Cor</Label>
            <div className="flex items-center gap-3">
              <input
                {...form.register("color")}
                id="color"
                type="color"
                className="h-10 w-14 cursor-pointer rounded border p-1"
              />
              <span className="text-sm text-muted-foreground">
                {selectedColor}
              </span>
            </div>
          </div>

          <div>
            <Label>Ícone</Label>
            <div className="mt-2 grid grid-cols-6 gap-2">
              {ICON_OPTIONS.map((name) => {
                const Icon = Icons[name as keyof typeof Icons] as Icons.LucideIcon;
                if (!Icon) return null;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => form.setValue("icon", name, { shouldValidate: true })}
                    className={cn(
                      "flex items-center justify-center rounded-lg border p-2 transition-colors",
                      selectedIcon === name
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
            {form.formState.errors.icon?.message && (
              <p className="mt-1 text-sm text-destructive">
                {form.formState.errors.icon.message}
              </p>
            )}
          </div>

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
