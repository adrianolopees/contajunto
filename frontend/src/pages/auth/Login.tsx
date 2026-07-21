import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const loginSchema = z.object({
  email: z.email({ message: "E-mail inválido" }),
  password: z
    .string()
    .min(8, { message: "A senha deve ter no mínimo 8 caracteres" })
    .max(72, { message: "A senha não pode exceder 72 caracteres" }),
});

export default function Login() {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });
  const navigate = useNavigate();

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    try {
      await login(data.email, data.password);
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    } catch {
      toast.error("Email ou senha inválidos");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-7 pt-22 pb-10 ">
      <div className="mb-10 flex flex-col items-center gap-3.5">
        <div className="relative h-14 w-14">
          <div className="absolute top-1/2 left-1/2 h-4.75 w-14 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[9px] bg-primary" />
          <div className="absolute top-1/2 left-1/2 h-4.75 w-14 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-[9px] bg-income" />
        </div>
        <h1 className="font-heading text-2xl font-extrabold text-foreground">
          conta junto
        </h1>
        <p className="max-w-65 text-center text-sm leading-relaxed text-muted-foreground">
          Suas finanças, e as da família, num só lugar.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">E-MAIL</Label>
            <Input
              {...register("email")}
              id="email"
              type="email"
              placeholder="voce@email.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">SENHA</Label>
            </div>
            <Input {...register("password")} id="password" type="password" />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>
        <Button type="submit" className="mt-5 w-full">
          Entrar
        </Button>

        <p className="mt-3.5 text-center text-sm font-semibold text-primary">
          Esqueceu a senha?
        </p>
        <div className="mt-7 flex items-center gap-2.5">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground/70">
            ou continue com
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="mt-4 flex gap-3">
          <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-input py-3.5">
            <span className="text-sm font-semibold">Apple</span>
          </div>
          <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-input py-3.5">
            <span className="text-sm font-semibold">Google</span>
          </div>
        </div>
      </form>
      <p className="mt-auto text-center text-sm">
        Não tem conta?{""}
        <Button
          variant="link"
          className="p-0 h-auto cursor-pointer"
          onClick={() => navigate("/register")}
        >
          Inscrever-se
        </Button>
      </p>
    </div>
  );
}
