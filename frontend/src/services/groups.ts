import { api } from "@/lib/api";
import type {
  CategorySpending,
  Transaction,
  TransactionsSummary,
} from "./transactions";

export interface GroupMember {
  id: string;
  name: string;
  email: string;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  users: GroupMember[];
}

type GroupMembership = {
  familyGroupId: string | null;
};

export async function createGroup(name: string): Promise<Omit<Group, "users">> {
  const res = await api.post("/groups", { name });
  return res.data.group;
}

export async function getGroup(): Promise<Omit<Group, "inviteCode">> {
  const res = await api.get("/groups");
  return res.data.group;
}

export async function getInviteCode(): Promise<string> {
  const res = await api.get("/groups/invite");
  return res.data.inviteCode;
}

export async function joinGroup(inviteCode: string): Promise<GroupMembership> {
  const res = await api.post("/groups/join", { inviteCode });
  return res.data.group;
}

export async function leaveGroup(): Promise<GroupMembership> {
  const res = await api.delete("/groups/leave");
  return res.data.group;
}

export type GroupTransaction = Transaction & {
  user: { id: string; name: string };
};

export async function getGroupTransactions(params?: {
  month?: number;
  year?: number;
}): Promise<GroupTransaction[]> {
  const res = await api.get("/groups/transactions", { params });
  return res.data.transactions;
}

export async function getGroupTransactionsSummary(params?: {
  month?: number;
  year?: number;
}): Promise<TransactionsSummary> {
  const res = await api.get("/groups/transactions/summary", { params });
  return res.data;
}

export async function getGroupCategorySpending(params?: {
  month?: number;
  year?: number;
}): Promise<CategorySpending[]> {
  const res = await api.get("/groups/transactions/summary/by-category", {
    params,
  });
  return res.data.categorySpending;
}

export interface MemberSpending {
  userId: string;
  total: number;
}

export async function getGroupMemberSpending(params?: {
  month?: number;
  year?: number;
}): Promise<MemberSpending[]> {
  const res = await api.get("/groups/members/spending", { params });
  return res.data.memberSpending;
}
