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
import CardManager from "@/components/CardManager";
import CategoryBudgetManager from "@/components/CategoryBudgetManager";

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100),
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
    },
  });

  async function onSubmit(data: z.infer<typeof profileSchema>) {
    try {
      const updated = await updateMe({ name: data.name });
      updateUser({ name: updated.name });
      toast.success("Perfil atualizado com sucesso!");
    } catch {
      toast.error("Erro ao atualizar perfil. Tente novamente.");
    }
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle>Seu perfil</CardTitle>
          <CardDescription>Atualize suas informações</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
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

            <Button type="submit" className="w-full cursor-pointer">
              Salvar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle>Cartões</CardTitle>
          <CardDescription>
            Usados para agrupar compras no crédito por fatura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CardManager />
        </CardContent>
      </Card>

      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle>Teto por categoria</CardTitle>
          <CardDescription>
            Defina um limite mensal opcional pra cada categoria de despesa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryBudgetManager />
        </CardContent>
      </Card>
    </div>
  );
}
