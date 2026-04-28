import { Response, Request } from "express";
import z from "zod";
import prisma from "../lib/prisma.js";

const groupSchema = z.object({
  name: z.string().min(3),
});

export async function createGroup(req: Request, res: Response) {
  const result = groupSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ errors: z.treeifyError(result.error) });
    return;
  }
  const nameGroup = result.data.name;

  const userId = req.user!.id;

  const existingGroup = await prisma.user.findUnique({
    where: { id: userId },
    select: { familyGroupId: true },
  });

  if (existingGroup?.familyGroupId !== null) {
    res
      .status(409)
      .json({ message: "You cannot belong to more than one group" });
    return;
  }

  const group = await prisma.$transaction(async (tx) => {
    const group = await tx.familyGroup.create({ data: { name: nameGroup } });
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
