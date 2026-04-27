import { Response, Request } from "express";
import prisma from "../lib/prisma.js";

export async function getMe(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      familyGroupId: true,
    },
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.status(200).json({ user });
}
