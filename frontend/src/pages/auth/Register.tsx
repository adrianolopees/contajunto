import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";
import Logo from "@/components/Logo";

const registerSchema = z
  .object({
    name: z
      .string({ error: "Nome é obrigatório" })
      .trim()
      .min(2, { error: "O nome deve ter no mínimo 2 caracteres" })
      .max(100, { error: "O nome não pode exceder 100 caracteres" }),
    email: z
      .string({ error: "E-mail é obrigatório" })
      .trim()
      .toLowerCase()
      .pipe(z.email({ error: "E-mail inválido" })),
    password: z
      .string({ error: "Senha é obrigatória" })
      .min(8, { error: "A senha deve ter no mínimo 8 caracteres" })
      .max(72, { error: "A senha não pode exceder 72 caracteres" }),
    confirmPassword: z
      .string({ error: "Senha é obrigatória" })
      .min(8, { error: "A senha deve ter no mínimo 8 caracteres" })
      .max(72, { error: "A senha não pode exceder 72 caracteres" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export default function Register() {
  const { register, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const {
    register: registerField,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: z.infer<typeof registerSchema>) {
    try {
      await register(data.name, data.email, data.password);
      await login(data.email, data.password);
      toast.success("Conta criada com sucesso!");
      navigate("/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setError("email", { message: "Email já cadastrado" });
      } else {
        toast.error("Erro ao criar conta. Tente novamente.");
      }
    }
  }
  return (
    <div className="flex relative min-h-dvh md:mx-auto md:max-w-sm flex-col bg-background px-7 pt-22 pb-10">
      <div className="mb-10 flex flex-col items-center gap-3.5">
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="icon"
          aria-label="Alternar tema"
          className="absolute top-5 right-5"
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>

        <Logo size={44} />

        <h1 className="font-heading text-3xl font-extrabold text-foreground">
          Criar conta
        </h1>
        <p className="max-w-65 text-center text-sm leading-relaxed text-muted-foreground">
          Comece a organizar suas finanças em minutos.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Label
              htmlFor="name"
              className="leading-relaxed text-muted-foreground"
            >
              NOME
            </Label>
            <Input
              {...registerField("name")}
              id="name"
              type="text"
              placeholder="Seu nome completo"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor="email"
              className="leading-relaxed text-muted-foreground"
            >
              E-MAIL
            </Label>
            <Input
              {...registerField("email")}
              id="email"
              type="email"
              placeholder="voce@email.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor="password"
              className="leading-relaxed text-muted-foreground"
            >
              SENHA
            </Label>
            <Input
              {...registerField("password")}
              id="password"
              type="password"
              placeholder="••••••••••"
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor="confirmaPassword"
              className="leading-relaxed text-muted-foreground"
            >
              CONFIRMAR SENHA
            </Label>
            <Input
              {...registerField("confirmPassword")}
              id="confirmPassword"
              type="password"
              placeholder="••••••••••"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            size="xl"
            className="w-full mt-8 cursor-pointer text-white font-extrabold"
          >
            Criar conta
          </Button>
        </div>
      </form>
      <p className="mt-auto text-center text-sm leading-relaxed text-muted-foreground">
        Já tem conta?{""}
        <Button
          variant="link"
          className="p-1 h-auto mt-3 font-extrabold"
          onClick={() => navigate("/login")}
        >
          Entrar
        </Button>
      </p>
    </div>
  );
}
