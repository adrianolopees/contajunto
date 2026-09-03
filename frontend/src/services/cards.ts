import { api } from "@/lib/api";

export interface Card {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
  color: string;
  createdAt: string;
}

type CardInput = {
  name: string;
  closingDay: number;
  dueDay: number;
  color: string;
};

export async function getCards(): Promise<Card[]> {
  const res = await api.get("/cards");
  return res.data.cards;
}

export async function createCard(data: CardInput): Promise<Card> {
  const res = await api.post("/cards", data);
  return res.data.card;
}

export async function updateCard(
  id: string,
  data: Partial<CardInput>,
): Promise<Card> {
  const res = await api.patch(`/cards/${id}`, data);
  return res.data.card;
}

export async function deleteCard(id: string): Promise<void> {
  await api.delete(`/cards/${id}`);
}

export interface Invoice {
  closeDate: string;
  dueDate: string;
  total: number;
  count: number;
  closed: boolean;
}

export interface Bill {
  card: {
    id: string;
    name: string;
    color: string;
    closingDay: number;
    dueDay: number;
  };
  current: Invoice;
  upcoming: Invoice | null;
}

export async function getBills(): Promise<{
  bills: Bill[];
  totalDue: number;
}> {
  const res = await api.get("/cards/bills");
  return res.data;
}
