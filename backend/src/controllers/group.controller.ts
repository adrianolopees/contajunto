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
  const result = groupSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ errors: z.flattenError(result.error) });
    return;
  }

  const userId = req.user!.id;

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
  const groupName = result.data.name;

  const group = await prisma.$transaction(async (tx) => {
    const group = await tx.familyGroup.create({ data: { name: groupName } });
    await tx.user.update({
      where: { id: userId },
      data: { familyGroupId: group.id },
    });
    return group;
  });
  res.status(201).json({
    group: { id: group.id, name: group.name, inviteCode: group.inviteCode },
  });
}

export async function joinGroup(req: Request, res: Response) {
  const result = joinSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ errors: z.flattenError(result.error) });
    return;
  }
  const inviteCode = result.data.inviteCode;
  const userId = req.user!.id;

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

  const group = await prisma.familyGroup.findUnique({
    where: { inviteCode: inviteCode },
    select: { id: true, _count: { select: { users: true } } },
  });

  if (!group) {
    res.status(404).json({ message: "Invalid invite code" });
    return;
  }
  const users = group._count.users;
  if (users >= 2) {
    res.status(409).json({ message: "The group exceeded the user limit" });
    return;
  }

  const newInviteCode = crypto.randomUUID();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { familyGroupId: group.id },
    }),
    prisma.familyGroup.update({
      where: { id: group.id },
      data: { inviteCode: newInviteCode },
    }),
  ]);

  res.status(200).json({ message: "Join group successfully" });
}

export async function getGroup(req: Request, res: Response) {
  const group = await prisma.user.findUnique({
    where: { id: req.user!.id },
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
    where: { id: req.user!.id },
    select: { familyGroup: { select: { inviteCode: true } } },
  });

  if (!user?.familyGroup) {
    res.status(404).json({ message: "User is not part of any group" });
    return;
  }
  res.status(200).json({ inviteCode: user.familyGroup.inviteCode });
}
