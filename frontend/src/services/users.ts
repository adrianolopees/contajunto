import type { User } from "../contexts/AuthContext";
import { api } from "@/lib/api";

export async function getMe(): Promise<User> {
  const res = await api.get("/users/me");
  return res.data.user;
}

export async function updateMe(data: {
  name?: string;
  monthlyBudget?: number | null;
}): Promise<User> {
  const res = await api.patch("/users/me", data);
  return res.data.user;
}
