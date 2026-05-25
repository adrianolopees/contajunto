import { Response, Request } from "express";
import { Prisma } from "../generated/prisma/index.js";
import z from "zod";
import prisma from "../lib/prisma.js";

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
  limit: z.coerce.number().int().positive().default(20),
  page: z.coerce.number().int().positive().default(1),
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
    await prisma.$transaction(async (tx) => {
      const group = await tx.familyGroup.findUnique({
        where: { inviteCode },
        include: { _count: { select: { users: true } } },
      });
      if (!group) throw new Error("INVALID_INVITE");
      if (group._count.users >= 2) throw new Error("GROUP_FULL");

      await tx.user.update({
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
    });

    res.status(200).json({ message: "Join group successfully" });
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
  res.status(200).json({ message: "Successfully left the group" });
}

export async function getGroupTransactions(req: Request, res: Response) {
  const { month, year: rawYear, limit, page } = querySchema.parse(req.query);
  const userId = req.user.id;
  const currentYear = new Date().getFullYear();
  const year = month && !rawYear ? currentYear : rawYear;

  const userWithGroup = await prisma.user.findFirst({
    where: { id: userId },
    include: { familyGroup: { include: { users: true } } },
  });

  if (!userWithGroup?.familyGroupId) {
    res.status(404).json({ message: "Family group not existis" });
    return;
  }

  const memberIds = userWithGroup.familyGroup?.users.map((user) => user.id);

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: { in: memberIds },
        ...(month && { month }),
        ...(year && { year }),
      },
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),

    prisma.transaction.count({
      where: {
        userId: { in: memberIds },
        ...(month && { month }),
        ...(year && { year }),
      },
    }),
  ]);
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({ transactions, total, page, totalPages });
}
