import { Request, Response } from "express";
import z from "zod";
import prisma from "../lib/prisma.js";
import { getBusinessYMD, getBusinessMonthYear } from "../lib/date.js";
import { buildCardInvoices, invoiceKey } from "../lib/invoice.js";

const MAX_CARDS = 5;

const cardSchema = z.object({
  name: z
    .string({ error: "Nome é obrigatório" })
    .trim()
    .min(2, { error: "O nome deve ter no mínimo 2 caracteres" })
    .max(50, { error: "O nome não pode exceder 50 caracteres" }),
  closingDay: z.number().int().min(1).max(31),
  dueDay: z.number().int().min(1).max(31),
  // a UI oferece uma paleta fixa de hex; a API não deveria aceitar qualquer
  // string que depois vira `style={{ backgroundColor }}` no cliente
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-f]{6}$/i, { error: "Cor deve ser hex no formato #rrggbb" }),
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

  const payments = await prisma.invoicePayment.findMany({
    where: { cardId: { in: cards.map((card) => card.id) } },
    select: { cardId: true, closeYear: true, closeMonth: true },
  });
  const paidKeysByCard = new Map<string, Set<string>>();
  for (const payment of payments) {
    const keys = paidKeysByCard.get(payment.cardId) ?? new Set<string>();
    keys.add(invoiceKey(payment.closeYear, payment.closeMonth));
    paidKeysByCard.set(payment.cardId, keys);
  }

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
      paidKeysByCard.get(card.id),
    );
    if (!current) continue;

    if (current.closed && !current.paid) {
      totalDueCents += Math.round(current.total * 100);
    }

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

const payBillSchema = z.object({
  cardId: z.uuid(),
  paidOn: z.iso.date().optional(),
});

// o valor pago é sempre o total da fatura fechada atual, recalculado aqui —
// nunca vem do body. Evita o cliente "pagar" um valor arbitrário e a fatura
// ser dada como quitada incorretamente (pagamento parcial fora de escopo)
export async function payBill(req: Request, res: Response) {
  const { cardId, paidOn } = payBillSchema.parse(req.body);
  const userId = req.user.id;

  const card = await prisma.card.findFirst({ where: { id: cardId, userId } });
  if (!card) {
    res.status(404).json({ message: "Card not found" });
    return;
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId, type: "EXPENSE", paymentMethod: "CREDIT", cardId },
    select: { amount: true, date: true },
  });
  const payments = await prisma.invoicePayment.findMany({
    where: { cardId },
    select: { closeYear: true, closeMonth: true },
  });
  const paidKeys = new Set(
    payments.map((p) => invoiceKey(p.closeYear, p.closeMonth)),
  );

  const { current } = buildCardInvoices(
    transactions.map((tx) => ({
      amountCents: Math.round(Number(tx.amount) * 100),
      purchase: getBusinessYMD(tx.date),
    })),
    card.closingDay,
    card.dueDay,
    getBusinessYMD(),
    paidKeys,
  );

  if (!current || !current.closed) {
    res.status(400).json({ message: "No closed invoice to pay yet" });
    return;
  }
  if (current.paid) {
    res.status(409).json({ message: "Invoice already paid" });
    return;
  }

  const paidOnDate = paidOn ? new Date(paidOn) : new Date();
  const { month, year } = getBusinessMonthYear(paidOnDate);

  const payment = await prisma.invoicePayment.create({
    data: {
      cardId,
      userId,
      amount: current.total,
      closeYear: current.closeYear,
      closeMonth: current.closeMonth,
      paidOn: paidOnDate,
      month,
      year,
    },
  });

  res.status(201).json({ payment });
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

  // apagar o cartão com parcela futura em aberto deixaria essa parcela órfã
  // (onDelete: SetNull) e ela sumiria de qualquer fatura sem avisar ninguém —
  // trava em vez disso, igual ao limite de 5 cartões (409)
  const pendingInstallment = await prisma.transaction.findFirst({
    where: {
      cardId,
      installmentGroupId: { not: null },
      date: { gt: new Date() },
    },
  });
  if (pendingInstallment) {
    res.status(409).json({
      message: "Card has pending installments and cannot be deleted",
    });
    return;
  }

  await prisma.card.delete({ where: { id: cardId } });

  res.status(200).json({ message: "Card deleted successfully" });
}
