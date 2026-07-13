import type { User } from "../contexts/AuthContext";
import { api } from "@/lib/api";

export async function getMe(): Promise<User> {
  const res = await api.get("/users/me");
  return res.data.user;
}

export async function updateMe(name: string): Promise<User> {
  const res = await api.patch("/users/me", { name });
  return res.data.user;
}
