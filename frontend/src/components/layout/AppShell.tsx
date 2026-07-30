import { Outlet, NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  Users,
  User,
  LogOut,
  Settings,
  Mail,
  CircleQuestionMark,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import ErrorBoundary from "@/components/ErrorBoundary";
import Logo from "@/components/Logo";
import {
  SheetTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

export default function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className="fixed top-0 h-14 z-50 flex items-center justify-between px-4 left-0 right-0
      border-b bg-background"
      >
        <Logo size={20} />
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {user?.name[0]}
              </div>
              <span className="max-w-14 truncate text-xs font-bold">
                {user?.name.split(" ")[0]}
              </span>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{user?.name}</SheetTitle>
              </SheetHeader>
              <SheetClose
                render={
                  <Link
                    to="/me"
                    className="mx-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted"
                  />
                }
              >
                <User size={18} />
                Meu perfil
              </SheetClose>
              <SheetClose
                render={
                  <Link
                    to="/"
                    className="mx-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted"
                  />
                }
              >
                <Mail size={18} />
                Notificações
              </SheetClose>
              <SheetClose
                render={
                  <Link
                    to="/"
                    className="mx-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted"
                  />
                }
              >
                <Settings size={18} />
                Configurações
              </SheetClose>
              <SheetClose
                render={
                  <Link
                    to="/"
                    className="mx-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted"
                  />
                }
              >
                <CircleQuestionMark size={18} />
                Ajuda e Suporte
              </SheetClose>
              <SheetFooter>
                <SheetClose
                  render={
                    <Button
                      onClick={handleLogout}
                      variant="destructive"
                      className="gap-2"
                      aria-label="Sair"
                    />
                  }
                >
                  <LogOut size={18} />
                  Sair
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <div className="w-px h-4.5 bg-border"></div>
          <Button
            onClick={toggleTheme}
            variant="outline"
            size="icon"
            aria-label="Alternar tema"
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>

      <main className="flex-1 pt-14 pb-20 overflow-y-auto">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      <nav className="fixed bottom-2.5 left-3.5 right-3.5 z-50 flex items-center justify-around p-1.5 rounded-3xl border bg-card shadow-nav">
        <NavLink to="/dashboard" className="flex flex-col items-center">
          {({ isActive }) => (
            <div
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-[16px] ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <LayoutDashboard size={20} />
              <span className="text-xs">Dashboard</span>
            </div>
          )}
        </NavLink>

        <NavLink to="/transactions" className="flex flex-col items-center">
          {({ isActive }) => (
            <div
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-[16px] ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <ArrowLeftRight size={20} />
              <span className="text-xs">Transações</span>
            </div>
          )}
        </NavLink>

        <NavLink to="/categories" className="flex flex-col items-center">
          {({ isActive }) => (
            <div
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-[16px] ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Tags size={20} />
              <span className="text-xs">Categorias</span>
            </div>
          )}
        </NavLink>

        <NavLink to="/familyGroup" className="flex flex-col items-center">
          {({ isActive }) => (
            <div
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-[16px] ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Users size={20} />
              <span className="text-xs">Grupo</span>
            </div>
          )}
        </NavLink>
      </nav>
    </div>
  );
}
