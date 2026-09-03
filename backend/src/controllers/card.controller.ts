import { Request, Response } from "express";
import z from "zod";
import prisma from "../lib/prisma.js";
import { getBusinessYMD } from "../lib/date.js";
import { buildCardInvoices } from "../lib/invoice.js";

const MAX_CARDS = 5;

const cardSchema = z.object({
  name: z
    .string({ error: "Nome é obrigatório" })
    .trim()
    .min(2, { error: "O nome deve ter no mínimo 2 caracteres" })
    .max(50, { error: "O nome não pode exceder 50 caracteres" }),
  closingDay: z.number().int().min(1).max(31),
  dueDay: z.number().int().min(1).max(31),
  color: z.string().trim().min(1).max(30),
});

const updateCardSchema = cardSchema.partial();

export async function getCards(req: Request, res: Response) {
  const cards = await prisma.card.findMany({
    where: { userId: req.user.id },
    omit: { userId: true },
    orderBy: { createdAt: "asc" },
  });

  res.status(200).json({ cards });
}

export async function getBills(req: Request, res: Response) {
  const userId = req.user.id;

  const cards = await prisma.card.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (cards.length === 0) {
    res.status(200).json({ bills: [], totalDue: 0 });
    return;
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      paymentMethod: "CREDIT",
      cardId: { in: cards.map((card) => card.id) },
    },
    select: { amount: true, date: true, cardId: true },
  });

  const today = getBusinessYMD();
  let totalDueCents = 0;
  const bills = [];

  for (const card of cards) {
    const inputs = transactions
      .filter((tx) => tx.cardId === card.id)
      .map((tx) => ({
        amountCents: Math.round(Number(tx.amount) * 100),
        purchase: getBusinessYMD(tx.date),
      }));

    const { current, upcoming } = buildCardInvoices(
      inputs,
      card.closingDay,
      card.dueDay,
      today,
    );
    if (!current) continue;

    if (current.closed) totalDueCents += Math.round(current.total * 100);

    bills.push({
      card: {
        id: card.id,
        name: card.name,
        color: card.color,
        closingDay: card.closingDay,
        dueDay: card.dueDay,
      },
      current,
      upcoming,
    });
  }

  res.status(200).json({ bills, totalDue: totalDueCents / 100 });
}

export async function createCard(req: Request, res: Response) {
  const data = cardSchema.parse(req.body);
  const userId = req.user.id;

  const count = await prisma.card.count({ where: { userId } });
  if (count >= MAX_CARDS) {
    res.status(409).json({ message: `Limite de ${MAX_CARDS} cartões` });
    return;
  }

  const card = await prisma.card.create({
    data: { ...data, userId },
    omit: { userId: true },
  });

  res.status(201).json({ card });
}

export async function updateCard(req: Request, res: Response) {
  const cardId = z.uuid().parse(req.params.id);
  const data = updateCardSchema.parse(req.body);

  const card = await prisma.card.findFirst({
    where: { id: cardId, userId: req.user.id },
  });
  if (!card) {
    res.status(404).json({ message: "Card not found" });
    return;
  }

  const updated = await prisma.card.update({
    where: { id: cardId },
    data,
    omit: { userId: true },
  });

  res.status(200).json({ card: updated });
}

export async function deleteCard(req: Request, res: Response) {
  const cardId = z.uuid().parse(req.params.id);

  const card = await prisma.card.findFirst({
    where: { id: cardId, userId: req.user.id },
  });
  if (!card) {
    res.status(404).json({ message: "Card not found" });
    return;
  }

  await prisma.card.delete({ where: { id: cardId } });

  res.status(200).json({ message: "Card deleted successfully" });
}
