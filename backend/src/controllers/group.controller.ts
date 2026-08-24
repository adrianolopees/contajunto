import { Response, Request } from "express";
import { Prisma } from "../generated/prisma/index.js";
import z from "zod";
import prisma from "../lib/prisma.js";
import { getBusinessMonthYear } from "../lib/date.js";
import { groupSpendingByCategoryGroup } from "../lib/categorySpending.js";

const MAX_GROUP_MEMBERS = 5;

const groupSchema = z.object({
  name: z
    .string({ error: "Nome é obrigatório" })
    .trim()
    .min(2, { error: "O nome deve ter no mínimo 2 caracteres" })
    .max(100, { error: "O nome não pode exceder 100 caracteres" }),
});

const joinSchema = z.object({
  inviteCode: z.uuid(),
});

const querySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().optional(),
});

export async function createGroup(req: Request, res: Response) {
  const { name } = groupSchema.parse(req.body);
  try {
    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.familyGroup.create({ data: { name } });
      await tx.user.update({
        where: { id: req.user.id, familyGroupId: null },
        data: { familyGroupId: newGroup.id },
      });
      return newGroup;
    });

    res.status(201).json({
      group: {
        id: group.id,
        name: group.name,
        inviteCode: group.inviteCode,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      res
        .status(409)
        .json({ message: "You cannot belong to more than one group" });
      return;
    }
    throw err;
  }
}

export async function joinGroup(req: Request, res: Response) {
  const { inviteCode } = joinSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { familyGroupId: true },
  });

  if (user?.familyGroupId) {
    res
      .status(409)
      .json({ message: "You cannot belong to more than one group" });
    return;
  }
  try {
    const groupId = await prisma.$transaction(async (tx) => {
      const group = await tx.familyGroup.findUnique({
        where: { inviteCode },
      });
      if (!group) throw new Error("INVALID_INVITE");

      // trava a linha do grupo: um segundo join concorrente pro mesmo grupo
      // espera esta transação commitar antes de contar os membros, fechando
      // a race condition de dois joins simultâneos passarem pela checagem juntos
      await tx.$queryRaw`SELECT id FROM "FamilyGroup" WHERE id = ${group.id} FOR UPDATE`;

      const memberCount = await tx.user.count({
        where: { familyGroupId: group.id },
      });
      if (memberCount >= MAX_GROUP_MEMBERS) throw new Error("GROUP_FULL");

      const updatedGroup = await tx.user.update({
        where: {
          id: req.user.id,
          familyGroupId: null,
        },
        data: { familyGroupId: group.id },
      });

      await tx.familyGroup.update({
        where: { id: group.id },
        data: { inviteCode: crypto.randomUUID() },
      });
      return updatedGroup;
    });

    res.status(200).json({ group: { familyGroupId: groupId.familyGroupId } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      res
        .status(409)
        .json({ message: "You cannot belong to more than one group" });
      return;
    }
    if (err instanceof Error) {
      if (err.message === "INVALID_INVITE") {
        res.status(404).json({ message: "Invalid invite code" });
        return;
      }
      if (err.message === "GROUP_FULL") {
        res.status(409).json({ message: "The group exceeded the user limit" });
        return;
      }
    }
    throw err;
  }
}

export async function getGroup(req: Request, res: Response) {
  const group = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      familyGroup: {
        select: {
          id: true,
          name: true,
          users: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!group?.familyGroup) {
    res.status(404).json({ message: "User is not part of any group" });
    return;
  }

  res.status(200).json({ group: group.familyGroup });
}

export async function getInviteCode(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { familyGroup: { select: { inviteCode: true } } },
  });

  if (!user?.familyGroup) {
    res.status(404).json({ message: "User is not part of any group" });
    return;
  }
  res.status(200).json({ inviteCode: user.familyGroup.inviteCode });
}

export async function leaveGroup(req: Request, res: Response) {
  const userId = req.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { familyGroupId: true },
  });

  if (!user?.familyGroupId) {
    res.status(404).json({ message: "User is not part of any group" });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { familyGroupId: null },
    });
    const count = await tx.user.count({
      where: { familyGroupId: user.familyGroupId },
    });

    if (count === 0) {
      await tx.familyGroup.delete({ where: { id: user.familyGroupId! } });
    }
  });
  res.status(200).json({ group: { familyGroupId: null } });
}

async function getGroupMemberIds(userId: string): Promise<string[] | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { familyGroupId: true },
  });

  if (!user?.familyGroupId) return null;

  const members = await prisma.user.findMany({
    where: { familyGroupId: user.familyGroupId },
    select: { id: true },
  });

  return members.map((member) => member.id);
}

export async function getGroupTransactions(req: Request, res: Response) {
  const { month: rawMonth, year: rawYear } = querySchema.parse(req.query);

  const { month: currentMonth, year: currentYear } = getBusinessMonthYear();
  const month = rawMonth || currentMonth;
  const year = rawYear || currentYear;

  const memberIds = await getGroupMemberIds(req.user.id);

  if (!memberIds) {
    res.status(404).json({ message: "User is not part of any group" });
    return;
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: { in: memberIds },
      month,
      year,
    },
    include: {
      category: { select: { id: true, name: true, color: true, icon: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  });

  res.status(200).json({ transactions });
}

export async function getGroupCategorySpending(req: Request, res: Response) {
  const { month: rawMonth, year: rawYear } = querySchema.parse(req.query);

  const { month: currentMonth, year: currentYear } = getBusinessMonthYear();
  const month = rawMonth || currentMonth;
  const year = rawYear || currentYear;

  const memberIds = await getGroupMemberIds(req.user.id);

  if (!memberIds) {
    res.status(404).json({ message: "User is not part of any group" });
    return;
  }

  const spending = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId: { in: memberIds }, month, year, type: "EXPENSE" },
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

export async function getGroupMemberSpending(req: Request, res: Response) {
  const { month: rawMonth, year: rawYear } = querySchema.parse(req.query);

  const { month: currentMonth, year: currentYear } = getBusinessMonthYear();
  const month = rawMonth || currentMonth;
  const year = rawYear || currentYear;

  const memberIds = await getGroupMemberIds(req.user.id);

  if (!memberIds) {
    res.status(404).json({ message: "User is not part of any group" });
    return;
  }

  const spending = await prisma.transaction.groupBy({
    by: ["userId"],
    where: { userId: { in: memberIds }, month, year, type: "EXPENSE" },
    _sum: { amount: true },
  });

  const memberSpending = spending.map((item) => ({
    userId: item.userId,
    total: Number(item._sum.amount ?? 0),
  }));

  res.status(200).json({ memberSpending });
}

export async function getGroupTransactionsSummary(req: Request, res: Response) {
  const { month: rawMonth, year: rawYear } = querySchema.parse(req.query);

  const { month: currentMonth, year: currentYear } = getBusinessMonthYear();
  const month = rawMonth || currentMonth;
  const year = rawYear || currentYear;

  const memberIds = await getGroupMemberIds(req.user.id);

  if (!memberIds) {
    res.status(404).json({ message: "User is not part of any group" });
    return;
  }

  const [expenseSummary, incomeSummary] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId: { in: memberIds },
        month,
        year,
        type: "EXPENSE",
      },
      _sum: { amount: true },
    }),

    prisma.transaction.aggregate({
      where: {
        userId: { in: memberIds },
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
