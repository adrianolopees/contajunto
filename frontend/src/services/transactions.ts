import { api } from "@/lib/api";

export interface Transaction {
  id: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  categoryId: string | null;
  date: string;
  month: number;
  year: number;
  createdAt: string;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
}

export interface TransactionsSummary {
  income: number;
  expense: number;
  balance: number;
}

export interface CategorySpendingLeaf {
  id: string;
  name: string;
  color: string;
  icon: string;
  userId: string;
  total: number;
}

export interface CategorySpending {
  group: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
  total: number;
  categories: CategorySpendingLeaf[];
}

export async function createTransaction(data: {
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  categoryId?: string | null;
}): Promise<Transaction> {
  const res = await api.post("/transactions", data);
  return res.data.transaction;
}

export async function getTransactions(params?: {
  month?: number;
  year?: number;
}): Promise<Transaction[]> {
  const res = await api.get("/transactions", { params });
  return res.data.transactions;
}

export async function getTransaction(id: string): Promise<Transaction> {
  const res = await api.get(`/transactions/${id}`);
  return res.data.transaction;
}

export async function updateTransaction(
  id: string,
  data: {
    amount?: number;
    type?: "INCOME" | "EXPENSE";
    description?: string;
    categoryId?: string | null;
  },
): Promise<Transaction> {
  const res = await api.patch(`/transactions/${id}`, data);
  return res.data.transaction;
}

export async function deleteTransaction(id: string) {
  await api.delete(`/transactions/${id}`);
}

export async function getTransactionsSummary(params?: {
  month?: number;
  year?: number;
}): Promise<TransactionsSummary> {
  const res = await api.get("/transactions/summary", { params });
  return res.data;
}

export async function getCategorySpending(params?: {
  month?: number;
  year?: number;
}): Promise<CategorySpending[]> {
  const res = await api.get("/transactions/summary/by-category", { params });
  return res.data.categorySpending;
}
