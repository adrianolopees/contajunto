import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading } = useAuth();

  if (isLoading) return <div> Carregando....</div>;
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/register" element={<div>Register</div>} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <div>Dashboard</div>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
