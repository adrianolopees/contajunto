import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { updateMe } from "@/services/users";

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100),
  monthlyBudget: z
    .string()
    .optional()
    .refine(
      (v) => !v || !isNaN(parseFloat(v.replace(",", "."))),
      "Valor inválido",
    )
    .refine(
      (v) => !v || parseFloat(v.replace(",", ".")) > 0,
      "Deve ser maior que zero",
    ),
});

export function Profile() {
  const { user, updateUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      monthlyBudget: (user?.monthlyBudget ?? "").replace(".", ","),
    },
  });

  async function onSubmit(data: z.infer<typeof profileSchema>) {
    try {
      const monthlyBudget = data.monthlyBudget
        ? parseFloat(data.monthlyBudget.replace(",", "."))
        : null;
      const updated = await updateMe({ name: data.name, monthlyBudget });
      updateUser({
        name: updated.name,
        monthlyBudget: updated.monthlyBudget,
      });
      toast.success("Perfil atualizado com sucesso!");
    } catch {
      toast.error("Erro ao atualizar perfil. Tente novamente.");
    }
  }

  return (
    <div className="px-4 py-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Seu perfil</CardTitle>
          <CardDescription>Atualize suas informações</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input {...register("name")} id="name" type="text" />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email ?? ""}
                disabled
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="monthlyBudget">
                Teto de gastos do mês (opcional)
              </Label>
              <Input
                {...register("monthlyBudget")}
                id="monthlyBudget"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
              />
              {errors.monthlyBudget && (
                <p className="text-sm text-destructive">
                  {errors.monthlyBudget.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full cursor-pointer">
              Salvar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
