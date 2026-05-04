import { Response, Request } from "express";
import z from "zod";
import prisma from "../lib/prisma.js";

const groupSchema = z.object({
  name: z.string().min(3),
});
const joinSchema = z.object({
  inviteCode: z.uuid(),
});

export async function createGroup(req: Request, res: Response) {
  const result = groupSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ errors: z.treeifyError(result.error) });
    return;
  }
  const groupName = result.data.name;

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
    res.status(400).json({ errors: z.treeifyError(result.error) });
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
  });

  if (!group) {
    res.status(404).json({ message: "Invalid invite code" });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { familyGroupId: group.id },
  });

  res.status(200).json({ message: "Join group successfully" });
}
