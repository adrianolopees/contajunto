import { Response, Request } from "express";
import z from "zod";
import prisma from "../lib/prisma.js";

const transactionSchema = z.object({
  amount: z.number().positive().multipleOf(0.01),
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().min(4).max(255),
  categoryId: z.uuid().optional(),
});

const updateTransactionSchema = transactionSchema.partial();

const querySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().positive().default(20),
  page: z.coerce.number().int().positive().default(1),
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
      userId,
      amount,
      type,
      description,
      categoryId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      date: now,
    },
  });

  res.status(201).json({ transaction });
}

export async function getTransactions(req: Request, res: Response) {
  const { month, year: rawYear, limit, page } = querySchema.parse(req.query);
  const userId = req.user.id;
  const currentYear = new Date().getFullYear();
  const year = month && !rawYear ? currentYear : rawYear;
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        ...(month && { month }),
        ...(year && { year }),
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),

    prisma.transaction.count({
      where: { userId, ...(month && { month }), ...(year && { year }) },
    }),
  ]);
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({ transactions, total, page, totalPages });
}

export async function getTransaction(req: Request, res: Response) {
  const transactionId = z.uuid().parse(req.params.id);

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId: req.user.id },
    include: {
      category: { select: { id: true, name: true, color: true, icon: true } },
    },
  });

  if (!transaction) {
    res.status(404).json({ message: "Transaction not found" });
    return;
  }

  res.status(200).json({ transaction });
}

export async function updateTransaction(req: Request, res: Response) {
  const transactionId = z.uuid().parse(req.params.id);
  const userId = req.user.id;

  const { amount, type, description, categoryId } =
    updateTransactionSchema.parse(req.body);

  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!category) {
      res.status(403).json({ message: "Invalid category" });
      return;
    }
  }
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!transaction) {
    res.status(404).json({ message: "Transaction not found" });
    return;
  }
  const updatedTransaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      amount,
      type,
      description,
      categoryId,
    },
  });
  res.status(200).json({ updatedTransaction });
}

export async function deleteTransaction(req: Request, res: Response) {
  const transactionId = z.uuid().parse(req.params.id);

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId: req.user.id },
  });

  if (!transaction) {
    res.status(404).json({ message: "Transaction not found" });
    return;
  }

  await prisma.transaction.delete({
    where: { id: transactionId },
  });

  res.status(200).json({ message: "Transaction deleted successfully" });
}

export async function getTransactionsSummary(req: Request, res: Response) {
  const { month, year: rawYear } = querySchema.parse(req.query);
  const currentYear = new Date().getFullYear();
  const userId = req.user.id;

  const year = month && !rawYear ? currentYear : rawYear;

  const [expenseSummary, incomeSummary] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        ...(month && { month }),
        ...(year && { year }),
        type: "EXPENSE",
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        ...(month && { month }),
        ...(year && { year }),
        type: "INCOME",
      },
      _sum: { amount: true },
    }),
  ]);
  const income = Number(incomeSummary._sum.amount ?? 0);
  const expense = Number(expenseSummary._sum.amount ?? 0);
  const balance = income - expense;

  res.status(200).json({ income, expense, balance });
}
