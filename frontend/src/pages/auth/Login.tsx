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
    <div className="flex min-h-screen items-center justify-center ">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Faça login na sua conta</CardTitle>
          <CardDescription>
            Digite seu e-mail abaixo para fazer login na sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  {...register("email")}
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
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  {...register("password")}
                  id="password"
                  type="password"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full cursor-pointer">
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <p>
            Não tem conta?{""}
            <Button
              variant="link"
              className="p-0 h-auto cursor-pointer"
              onClick={() => navigate("/register")}
            >
              Inscrever-se
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
