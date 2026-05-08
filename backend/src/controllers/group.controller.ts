import { Response, Request } from "express";
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

export async function createGroup(req: Request, res: Response) {
  const { name: nameGroup } = groupSchema.parse(req.body);
  const userId = req.user.id;

  const existingGroup = await prisma.user.findUnique({
    where: { id: userId },
    select: { familyGroupId: true },
  });

  if (existingGroup?.familyGroupId) {
    res
      .status(409)
      .json({ message: "You cannot belong to more than one group" });
    return;
  }

  const createdGroup = await prisma.$transaction(async (tx) => {
    const newGroup = await tx.familyGroup.create({ data: { name: nameGroup } });
    await tx.user.update({
      where: { id: userId },
      data: { familyGroupId: newGroup.id },
    });
    return newGroup;
  });

  res.status(201).json({
    group: {
      id: createdGroup.id,
      name: createdGroup.name,
      inviteCode: createdGroup.inviteCode,
    },
  });
}

export async function joinGroup(req: Request, res: Response) {
  const { inviteCode } = joinSchema.parse(req.body);
  const userId = req.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      const group = await tx.familyGroup.findUnique({
        where: { inviteCode },
        include: { _count: { select: { users: true } } },
      });

      if (!group) throw new Error("INVALID_INVITE");
      if (group._count.users >= 2) throw new Error("GROUP_FULL");

      const updatedUser = await tx.user.update({
        where: {
          id: userId,
          familyGroupId: null,
        },
        data: { familyGroupId: group.id },
      });

      await tx.familyGroup.update({
        where: { id: group.id },
        data: { inviteCode: crypto.randomUUID() },
      });
      return updatedUser;
    });

    res.status(200).json({ message: "Join group successfully" });
  } catch (err) {
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
