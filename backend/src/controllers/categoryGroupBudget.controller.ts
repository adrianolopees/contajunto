import { Response, Request } from "express";
import z from "zod";
import prisma from "../lib/prisma.js";

const setBudgetsSchema = z.object({
  budgets: z.array(
    z.object({
      groupId: z.uuid(),
      // null remove o teto do grupo (volta a "sem teto configurado")
      amount: z.number().positive().multipleOf(0.01).nullable(),
    }),
  ),
});

export async function getCategoryGroupBudgets(req: Request, res: Response) {
  const budgets = await prisma.categoryGroupBudget.findMany({
    where: { userId: req.user.id },
    select: { groupId: true, amount: true },
  });

  res.status(200).json({ budgets });
}

export async function setCategoryGroupBudgets(req: Request, res: Response) {
  const { budgets } = setBudgetsSchema.parse(req.body);
  const userId = req.user.id;

  // teto só faz sentido pra categoria de despesa — mesmo grupo que já é
  // filtrado por type: "EXPENSE" em todo o resto do catálogo
  const groupIds = budgets.map((b) => b.groupId);
  const validGroups = await prisma.categoryGroup.findMany({
    where: { id: { in: groupIds }, type: "EXPENSE" },
    select: { id: true },
  });
  const validGroupIds = new Set(validGroups.map((g) => g.id));
  if (groupIds.some((id) => !validGroupIds.has(id))) {
    res.status(404).json({ message: "Invalid category group" });
    return;
  }

  await prisma.$transaction(
    budgets.map(({ groupId, amount }) =>
      amount === null
        ? prisma.categoryGroupBudget.deleteMany({ where: { userId, groupId } })
        : prisma.categoryGroupBudget.upsert({
            where: { userId_groupId: { userId, groupId } },
            update: { amount },
            create: { userId, groupId, amount },
          }),
    ),
  );

  const updated = await prisma.categoryGroupBudget.findMany({
    where: { userId },
    select: { groupId: true, amount: true },
  });

  res.status(200).json({ budgets: updated });
}
