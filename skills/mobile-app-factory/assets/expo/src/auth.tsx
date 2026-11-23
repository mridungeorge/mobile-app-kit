import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { Api } from './api';

const TOKEN_KEY = 'session-token';

type Auth = {
  token: string | null;
  ready: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

export function validateCredentials(email: string, password: string): string | null {
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return 'Enter a valid email address.';
  if (password.length < 8) return 'Your password needs at least 8 characters.';
  return null;
}

export function AuthProvider({ api, children }: { api: Api; children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .then(setToken)
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<Auth>(() => ({
    token,
    ready,
    async signIn(email, password) {
      const problem = validateCredentials(email, password);
      if (problem) throw new Error(problem);
      // Stub: replace with the real identity provider. The token lives in the keychain,
      // never in AsyncStorage, so a rooted device backup does not carry it.
      const next = `stub:${email.trim().toLowerCase()}`;
      await SecureStore.setItemAsync(TOKEN_KEY, next);
      setToken(next);
    },
    async signOut() {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setToken(null);
    },
    async deleteAccount() {
      if (token) await api.deleteAccount(token);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setToken(null);
    },
  }), [api, token, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
}
