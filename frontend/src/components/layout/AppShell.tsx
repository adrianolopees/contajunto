import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  Users,
  CircleUser,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/button";

export default function AppShell() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // logout() já limpou o estado local via finally
    } finally {
      navigate("/login");
    }
  }
  return (
    <div className="flex flex-col min-h-screen">
      <header
        className="fixed top-0 h-14 z-50 flex items-center justify-between px-4 left-0 right-0
      border-b bg-background"
      >
        <h1>LOGO</h1>
        <div className="flex items-center gap-2">
          {user?.name.split(" ")[0]}
          <Button onClick={handleLogout} variant="ghost" size="icon">
            <LogOut />
          </Button>
        </div>
      </header>

      <main className="flex-1 pt-14 pb-16 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 h-16 z-50 flex items-center justify-around px-4 left-0 right-0 border-t bg-background">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center ${isActive ? "text-primary" : "text-muted-foreground"}`
          }
        >
          <LayoutDashboard size={20} />
          <span className="text-xs">Dashboard</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            `flex flex-col items-center ${isActive ? "text-primary" : "text-muted-foreground"}`
          }
        >
          <ArrowLeftRight size={20} />
          <span className="text-xs">Transações</span>
        </NavLink>
        <NavLink
          to="/categories"
          className={({ isActive }) =>
            `flex flex-col items-center ${isActive ? "text-primary" : "text-muted-foreground"}`
          }
        >
          <Tags size={20} />
          <span className="text-xs">Categorias</span>
        </NavLink>
        <NavLink
          to="/familyGroup"
          className={({ isActive }) =>
            `flex flex-col items-center ${isActive ? "text-primary" : "text-muted-foreground"}`
          }
        >
          <Users size={20} />
          <span className="text-xs">Grupo</span>
        </NavLink>
        <NavLink
          to="/me"
          className={({ isActive }) =>
            `flex flex-col items-center ${isActive ? "text-primary" : "text-muted-foreground"}`
          }
        >
          <CircleUser size={20} />
          <span className="text-xs">Perfil</span>
        </NavLink>
      </nav>
    </div>
  );
}
