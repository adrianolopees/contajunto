import { Response, Request } from "express";
import z from "zod";
import prisma from "../lib/prisma.js";
import { getBusinessMonthYear } from "../lib/date.js";
import { groupSpendingByCategoryGroup } from "../lib/categorySpending.js";

const transactionSchema = z.object({
  amount: z.number().positive().multipleOf(0.01),
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().max(255).optional(),
  categoryId: z.uuid().optional(),
  paymentMethod: z.enum(["DEBIT", "CREDIT", "PIX", "CASH"]).optional(),
});

const updateTransactionSchema = transactionSchema.partial().extend({
  categoryId: z.uuid().nullable().optional(),
  paymentMethod: z.enum(["DEBIT", "CREDIT", "PIX", "CASH"]).nullable().optional(),
});

const querySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().optional(),
});

export async function createTransaction(req: Request, res: Response) {
  const { amount, type, description, categoryId, paymentMethod } =
    transactionSchema.parse(req.body);

  const userId = req.user.id;

  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId, type },
    });
    if (!category) {
      res.status(404).json({ message: "Invalid category" });
      return;
    }
  }

  const now = new Date();
  const { month, year } = getBusinessMonthYear(now);

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      amount,
      type,
      description: description ?? "",
      categoryId,
      paymentMethod,
      month,
      year,
      date: now,
    },
  });

  res.status(201).json({ transaction });
}

export async function getTransactions(req: Request, res: Response) {
  const { month: rawMonth, year: rawYear } = querySchema.parse(req.query);

  const { month: currentMonth, year: currentYear } = getBusinessMonthYear();
  const month = rawMonth || currentMonth;
  const year = rawYear || currentYear;

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: req.user.id,
      month,
      year,
    },
    include: {
      category: { select: { id: true, name: true, color: true, icon: true } },
    },
    orderBy: { date: "desc" },
  });

  res.status(200).json({ transactions });
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

  const { amount, type, description, categoryId, paymentMethod } =
    updateTransactionSchema.parse(req.body);

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!transaction) {
    res.status(404).json({ message: "Transaction not found" });
    return;
  }

  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId, type: type ?? transaction.type },
    });
    if (!category) {
      res.status(404).json({ message: "Invalid category" });
      return;
    }
  }

  const updatedTransaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      amount,
      type,
      description,
      categoryId,
      paymentMethod,
    },
  });
  res.status(200).json({ transaction: updatedTransaction });
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
  const { month: rawMonth, year: rawYear } = querySchema.parse(req.query);
  const userId = req.user.id;

  const { month: currentMonth, year: currentYear } = getBusinessMonthYear();
  const month = rawMonth || currentMonth;
  const year = rawYear || currentYear;

  const [expenseSummary, incomeSummary] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        month,
        year,
        type: "EXPENSE",
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        month,
        year,
        type: "INCOME",
      },
      _sum: { amount: true },
    }),
  ]);
  const incomeCents = Math.round(Number(incomeSummary._sum.amount ?? 0) * 100);
  const expenseCents = Math.round(
    Number(expenseSummary._sum.amount ?? 0) * 100,
  );

  res.status(200).json({
    income: incomeCents / 100,
    expense: expenseCents / 100,
    balance: (incomeCents - expenseCents) / 100,
  });
}

export async function getCategorySpending(req: Request, res: Response) {
  const { month: rawMonth, year: rawYear } = querySchema.parse(req.query);
  const userId = req.user.id;

  const { month: currentMonth, year: currentYear } = getBusinessMonthYear();
  const month = rawMonth || currentMonth;
  const year = rawYear || currentYear;

  const spending = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, month, year, type: "EXPENSE" },
    _sum: { amount: true },
  });

  const categorySpending = await groupSpendingByCategoryGroup(
    spending.map((item) => ({
      categoryId: item.categoryId,
      total: Number(item._sum.amount ?? 0),
    })),
  );

  res.status(200).json({ categorySpending });
}
