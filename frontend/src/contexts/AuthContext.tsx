import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { api, setAuthToken, setUnauthenticatedCallback } from "../lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  familyGroupId: string | null;
}

interface AuthContextData {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    defaultCategoryIds: string[],
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextData | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUnauthenticatedCallback(() => {
      setUser(null);
      setAccessToken(null);
      setAuthToken(null);
    });
  }, []);

  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await api.post("/auth/refresh");
        setAccessToken(res.data.accessToken);
        setAuthToken(res.data.accessToken);
        setUser(res.data.user);
      } catch {
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    setAccessToken(res.data.accessToken);
    setAuthToken(res.data.accessToken);
    setUser(res.data.user);
  }

  async function register(
    name: string,
    email: string,
    password: string,
    defaultCategoryIds: string[],
  ) {
    await api.post("/auth/register", {
      name,
      email,
      password,
      defaultCategoryIds,
    });
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setAuthToken(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
