import { Response, Request } from "express";
import prisma from "../lib/prisma.js";
import z from "zod";

const updateSchema = z.object({
  name: z
    .string({ error: "Nome é obrigatório" })
    .trim()
    .min(2, { error: "O nome deve ter no mínimo 2 caracteres" })
    .max(100, { error: "O nome não pode exceder 100 caracteres" })
    .optional(),
  monthlyBudget: z
    .number()
    .positive({ error: "O teto deve ser maior que zero" })
    .multipleOf(0.01)
    .nullable()
    .optional(),
});

export async function getMe(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      monthlyBudget: true,
      createdAt: true,
      familyGroupId: true,
    },
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.status(200).json({ user });
}

export async function updateMe(req: Request, res: Response) {
  const { name, monthlyBudget } = updateSchema.parse(req.body);

  const userUpdated = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, monthlyBudget },
    omit: { passwordHash: true },
  });

  res.status(200).json({ user: userUpdated });
}
