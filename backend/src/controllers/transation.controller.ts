import { Response, Request } from "express";
import z from "zod";
import prisma from "../lib/prisma.js";

const transactionSchema = z.object({
  amount: z.number().positive().multipleOf(0.01),
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().min(4).max(255),
  categoryId: z.uuid().optional(),
});

const querySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().optional(),
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

export async function getTransactions(req: Request, res: Response) {
  const { month, year: rawYear } = querySchema.parse(req.query);
  const currentYear = new Date().getFullYear();

  const year = month && !rawYear ? currentYear : rawYear;
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: req.user.id,
      ...(month && { month }),
      ...(year && { year }),
    },
  });

  res.status(200).json({ transactions });
}
