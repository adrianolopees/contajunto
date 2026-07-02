import { api } from "@/lib/api";

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
