import axios from "axios";

let authToken: string | null = null;
let unauthenticatedCallback: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthenticatedCallback(fn: () => void) {
  unauthenticatedCallback = fn;
}

export const api = axios.create({
  // Origem única: as rotas do backend ficam sob /api. Em dev, o proxy do Vite
  // (vite.config.ts) encaminha /api -> localhost:3333. Em produção, o próprio
  // Express serve a SPA e a API no mesmo domínio.
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/auth/refresh")
      .then((res) => {
        setAuthToken(res.data.accessToken);
        return res.data.accessToken as string;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/refresh")
    ) {
      original._retry = true;

      try {
        await refreshAccessToken();
        return api(original);
      } catch {
        setAuthToken(null);
        unauthenticatedCallback?.();
      }
    }
    return Promise.reject(error);
  },
);
