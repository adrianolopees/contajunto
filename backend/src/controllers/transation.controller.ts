import { Response, Request } from "express";
import z from "zod";
import prisma from "../lib/prisma.js";

const transactionSchema = z.object({
  amount: z.number().positive().multipleOf(0.01),
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().min(4).max(255),
  categoryId: z.uuid().optional(),
});

export async function createTransaction(req: Request, res: Response) {
  const { amount, type, description, categoryId } = transactionSchema.parse(
    req.body,
  );

  const userId = req.user.id;

  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!category) {
      res.status(403).json({ message: "Invalid category" });
      return;
    }
  }

  const now = new Date();

  const transaction = await prisma.transaction.create({
    data: {
      userId: userId,
      amount: amount,
      type: type,
      description: description,
      categoryId: categoryId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      date: now,
    },
  });

  res.status(201).json({ transaction });
}
