import type { User } from "../contexts/AuthContext";
import { api } from "@/lib/api";

// getMe não existe aqui de propósito: login e refresh já devolvem `user`, e
// nenhuma tela precisou de um refetch avulso até agora

export async function updateMe(data: { name?: string }): Promise<User> {
  const res = await api.patch("/users/me", data);
  return res.data.user;
}
