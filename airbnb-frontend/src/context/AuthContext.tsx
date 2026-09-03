import { createContext, useContext, useState, type ReactNode } from 'react';
import { login as loginRequest, logout as logoutRequest, register as registerRequest } from '../api/client';
import type { User } from '../types';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readSession() {
  try {
    return JSON.parse(localStorage.getItem('staybnb-session') ?? 'null') as { user: User; token: string } | null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(readSession);

  const saveSession = (nextSession: { user: User; token: string }) => {
    localStorage.setItem('staybnb-session', JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const login = async (email: string, password: string) => saveSession(await loginRequest(email, password));
  const register = async (name: string, email: string, password: string) => saveSession(await registerRequest(name, email, password));
  const logout = async () => {
    if (session?.token) await logoutRequest(session.token).catch(() => undefined);
    localStorage.removeItem('staybnb-session');
    setSession(null);
  };

  return <AuthContext.Provider value={{ user: session?.user ?? null, token: session?.token ?? null, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}