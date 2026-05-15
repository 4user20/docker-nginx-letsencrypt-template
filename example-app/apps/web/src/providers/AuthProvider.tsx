import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import * as api from "@/api/client";

export type { DemoUser } from "@/api/client";

interface AuthCtx {
  user: api.DemoUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  demoLogin: () => Promise<void>;
  expireSession: () => void;
  sessionExpired: boolean;
  dismissExpired: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<api.DemoUser | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setExpired] = useState(false);

  // On mount, try to restore session from localStorage token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getMe()
      .then((u) => setUser(u))
      .catch(() => {
        // Token expired or invalid — clear it
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  const demoLogin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.demoLogin();
      localStorage.setItem("token", res.token);
      setUser(res.user);
    } catch (e: any) {
      setError(e.message ?? "demo login failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.loginWithPassword(email, password);
      localStorage.setItem("token", res.token);
      setUser(res.user);
    } catch (e: any) {
      setError(e.message ?? "login failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithPasswordFn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.loginWithPassword(email, password);
      localStorage.setItem("token", res.token);
      setUser(res.user);
    } catch (e: any) {
      setError(e.message ?? "login failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: { name: string; email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.register(data);
      localStorage.setItem("token", res.token);
      setUser(res.user);
    } catch (e: any) {
      setError(e.message ?? "registration failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    // Fire-and-forget logout — clear local state immediately
    api.logout().catch(() => {});
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const expireSession = useCallback(() => {
    setExpired(true);
    setUser(null);
    localStorage.removeItem("token");
  }, []);

  const dismissExpired = useCallback(() => setExpired(false), []);

  const isAdmin = !!user && user.role === "admin";

  return (
    <Ctx.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isLoading,
        error,
        login,
        loginWithPassword: loginWithPasswordFn,
        register,
        logout,
        demoLogin,
        expireSession,
        sessionExpired,
        dismissExpired,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
