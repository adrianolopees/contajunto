import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import axios from "axios";
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
    .min(2, "O nome deve ter no mínimo 2 caracteres")
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
      toast.success("Você entrou no grupo!");
    } catch (error) {
      // o backend distingue convite inválido (404), grupo cheio e "já está
      // num grupo" (409) — dizer "código inválido" pra tudo mandava o usuário
      // conferir um código que estava certo
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const message: string | undefined = error.response.data?.message;
        toast.error(
          message?.includes("exceeded")
            ? "Esse grupo já está cheio."
            : "Você já faz parte de um grupo.",
        );
      } else if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.error("Código de convite inválido.");
      } else {
        toast.error("Erro ao entrar no grupo. Tente novamente.");
      }
    }
  }
  return (
    // dentro do AppShell (header + nav fixos): min-h-screen estourava a
    // viewport e deixava scroll atrás da nav
    <div className="flex justify-center px-4 py-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          {mode === "create" ? (
            <>
              <CardTitle>Crie seu grupo</CardTitle>
              <CardDescription>
                Qual nome quer dar ao seu grupo?
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle>Junte suas finanças</CardTitle>
              <CardDescription>
                Entre no grupo da sua família com o código de convite
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {mode === "create" && (
            <form onSubmit={handleSubmitCreate(onSubmitCreate)} noValidate>
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
            <form onSubmit={handleSubmitJoin(onSubmitJoin)} noValidate>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="inviteCode">Código de convite</Label>
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
