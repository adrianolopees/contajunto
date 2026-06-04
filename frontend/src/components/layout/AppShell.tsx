import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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
    <>
      <header>
        <h1>ContaJunto</h1>
        <span>{user?.name}</span>
        <button onClick={handleLogout}> Sair</button>
      </header>
      <main>
        <Outlet />
      </main>
      <nav>
        <NavLink to="/dashboard">Dashboard</NavLink>

        <NavLink to="/transactions">Transações</NavLink>
        <NavLink to="/categories">Categorias</NavLink>
        <NavLink to="/familyGroup">Grupo</NavLink>
        <NavLink to="/me">Perfil</NavLink>
      </nav>
    </>
  );
}
