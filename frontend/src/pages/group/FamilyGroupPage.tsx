import { useAuth } from "@/hooks/useAuth";
import { GroupSetup } from "./GroupSetup";
import { GroupDashboard } from "./GroupDashboard";

export function FamilyGroupPage() {
  const { user } = useAuth();

  if (!user) return null;
  return user.familyGroupId ? <GroupDashboard /> : <GroupSetup />;
}
