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
  baseURL: "http://localhost:3333",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

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
        const res = await api.post("/auth/refresh");
        setAuthToken(res.data.accessToken);
        return api(original);
      } catch {
        setAuthToken(null);
        unauthenticatedCallback?.();
      }
    }
    return Promise.reject(error);
  },
);
