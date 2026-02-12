import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';

export type AuthUser = {
  id: number;
  email: string;
  is_admin?: number;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: AuthUser }>('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    await apiFetch<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      json: { email, password }
    });
    await refresh();
  }, [refresh]);

  const register = useCallback(async (email: string, password: string) => {
    await apiFetch<{ user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      json: { email, password }
    });
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return { user, loading, refresh, login, register, logout };
  }, [user, loading, refresh, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
