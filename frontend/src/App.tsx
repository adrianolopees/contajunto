import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import AppShell from "@/components/layout/AppShell";
import type React from "react";
import Dashboard from "@/pages/Dashboard";
import { Profile } from "@/pages/profile/Profile";
import { FamilyGroupPage } from "@/pages/group/FamilyGroupPage";
import TransactionForm from "@/pages/transactions/TransactionForm";
import CategoryList from "@/pages/categories/CategoryList";
import CategoryDetail from "@/pages/categories/CategoryDetail";
import TransactionList from "@/pages/transactions/TransactionList";

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<TransactionList />} />
          <Route path="/transactions/new" element={<TransactionForm />} />
          <Route path="/transactions/:id/edit" element={<TransactionForm />} />
          <Route path="/categories" element={<CategoryList />} />
          <Route path="/categories/:id" element={<CategoryDetail />} />
          <Route path="/familyGroup" element={<FamilyGroupPage />} />
          <Route path="/me" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
