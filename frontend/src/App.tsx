import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AppShell from "./components/layout/AppShell";
import type React from "react";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading } = useAuth();

  if (isLoading) return null;
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading } = useAuth();
  if (isLoading) return null;
  if (accessToken) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

        <Route
          element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<div>Dashboard página</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
