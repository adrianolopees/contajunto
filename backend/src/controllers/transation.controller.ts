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

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category || category.userId !== req.user.id) {
      res.status(403).json({ message: "Invalid category" });
      return;
    }
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await prisma.transaction.create({
    data: {
      userId: req.user.id,
      amount: amount,
      type: type,
      description: description,
      categoryId: categoryId,
      month: month,
      year: year,
      date: now,
    },
  });

  res.status(201).json({ message: "Transaction created successfully" });
}
