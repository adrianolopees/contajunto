import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";

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
    defaultCategoryIds: z.array(z.string()).optional(),
    confirmPassword: z
      .string({ error: "Senha é obrigatória" })
      .min(8, { error: "A senha deve ter no mínimo 8 caracteres" })
      .max(72, { error: "A senha não pode exceder 72 caracteres" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

interface DefaultCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<DefaultCategory[]>([]);
  const [step, setStep] = useState(1);
  const {
    register: registerField,
    handleSubmit,
    setError,
    trigger,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await api.get("/categories/default");
        setCategories(res.data.categoriesDefault);
      } catch {
        // categories optional - silence fail
      }
    }
    fetchCategories();
  }, []);

  async function handleNext() {
    const valid = await trigger([
      "name",
      "email",
      "password",
      "confirmPassword",
    ]);
    if (valid) setStep(2);
  }

  async function onSubmit(data: z.infer<typeof registerSchema>) {
    try {
      await register(
        data.name,
        data.email,
        data.password,
        data.defaultCategoryIds ?? [],
      );
      await login(data.email, data.password);
      toast.success("Conta criada com sucesso!");
      navigate("/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setStep(1);
        setError("email", { message: "Email já cadastrado" });
      } else {
        toast.error("Erro ao criar conta. Tente novamente.");
      }
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center ">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Registre-se</CardTitle>
          <CardDescription>
            Inscreva-se para começar aproveitar nosso app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {step === 1 && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      {...registerField("name")}
                      id="name"
                      type="text"
                      placeholder="name"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      {...registerField("email")}
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      {...registerField("password")}
                      id="password"
                      type="password"
                      placeholder="senha"
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmaPassword">Confirme sua senha</Label>
                    <Input
                      {...registerField("confirmPassword")}
                      id="confirmPassword"
                      type="password"
                      placeholder="xxxxxxxxxx"
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </>
              )}
              {step === 2 && (
                <div className="grid gap-2">
                  <Label>Categorias (opcional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-sm has-checked:bg-primary has-checked:text-primary-foreground has-checked:border-primary"
                      >
                        <input
                          type="checkbox"
                          value={category.id}
                          className="sr-only"
                          {...registerField("defaultCategoryIds")}
                        />
                        {category.icon} {category.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {step === 1 && (
              <Button
                type="button"
                className="w-full cursor-pointer"
                onClick={handleNext}
              >
                Próximo
              </Button>
            )}
            {step === 2 && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Voltar
                </Button>
                <Button type="submit" className="flex-1 cursor-pointer">
                  Criar conta
                </Button>
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter>
          <p>
            Já tem conta?{""}
            <Button
              variant="link"
              className="p-0 h-auto cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
