import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { createGroup, joinGroup } from "@/services/groups";

const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, "Nome tem que ter no minimo dois caracateres")
    .max(100),
});
const joinGroupSchema = z.object({
  inviteCode: z.uuid(),
});
export function GroupSetup() {
  const [mode, setMode] = useState<"create" | "join">("create");
  const { updateUser } = useAuth();

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors },
  } = useForm({
    resolver: zodResolver(createGroupSchema),
  });

  const {
    register: registerJoin,
    handleSubmit: handleSubmitJoin,
    formState: { errors: joinErrors },
  } = useForm({
    resolver: zodResolver(joinGroupSchema),
  });

  async function onSubmitCreate(data: z.infer<typeof createGroupSchema>) {
    try {
      const group = await createGroup(data.name);
      updateUser({ familyGroupId: group.id });
      toast.success("Grupo criado com sucesso!");
    } catch {
      toast.error("Erro ao criar grupo. Tente novamente.");
    }
  }

  async function onSubmitJoin(data: z.infer<typeof joinGroupSchema>) {
    try {
      const membership = await joinGroup(data.inviteCode);
      updateUser(membership);
      toast.success("você entrou no grupo!");
    } catch {
      toast.error("Código de convite inválido");
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          {mode === "create" ? (
            <>
              <CardTitle>Crie seu grupo</CardTitle>
              <CardDescription>
                Qual nome quer dar a seu grupo ?
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle>Junte suas finanças</CardTitle>
              <CardDescription>
                Encontre atravez do convite seu familiar
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {mode === "create" && (
            <form onSubmit={handleSubmitCreate(onSubmitCreate)}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Grupo</Label>
                  <Input
                    {...registerCreate("name")}
                    id="name"
                    type="text"
                    placeholder="silva"
                  />
                  {createErrors.name && (
                    <p className="text-sm text-destructive">
                      {createErrors.name.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full cursor-pointer">
                  Criar
                </Button>
              </div>
            </form>
          )}
          {mode === "join" && (
            <form onSubmit={handleSubmitJoin(onSubmitJoin)}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="inviteCode">Codigo de convite</Label>
                  </div>
                  <Input
                    {...registerJoin("inviteCode")}
                    id="inviteCode"
                    type="text"
                  />
                  {joinErrors.inviteCode && (
                    <p className="text-sm text-destructive">
                      {joinErrors.inviteCode.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full cursor-pointer">
                  Entrar
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-2">
          {mode === "create" ? (
            <p>
              Você tem um código de convite?{" "}
              <Button
                variant="link"
                className="p-0 h-auto cursor-pointer"
                onClick={() => setMode("join")}
              >
                Clique aqui
              </Button>
            </p>
          ) : (
            <p>
              Quer criar um grupo novo?{" "}
              <Button
                variant="link"
                className="p-0 h-auto cursor-pointer"
                onClick={() => setMode("create")}
              >
                Clique aqui
              </Button>
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
