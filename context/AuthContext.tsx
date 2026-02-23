import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  authApi,
  AuthResponse,
  LoginRequest,
  RegisterStartRequest,
  UserDto,
  VerifyOtpRequest,
} from '@/lib/api';

const TOKEN_KEY = '@nongxanh:token';
const USER_KEY = '@nongxanh:user';

type AuthState = {
  user: UserDto | null;
  token: string | null;
  isLoading: boolean;
  isReady: boolean;
};

type AuthContextValue = AuthState & {
  login: (body: LoginRequest) => Promise<void>;
  register: (body: RegisterStartRequest) => Promise<{ email: string }>;
  verifyOtp: (body: VerifyOtpRequest) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistAuth(data: AuthResponse) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, data.accessToken],
    [USER_KEY, JSON.stringify(data.user)],
  ]);
}

async function clearAuth() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: false,
    isReady: false,
  });

  const loadStored = useCallback(async () => {
    try {
      const [token, userJson] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
      const user = userJson[1] ? (JSON.parse(userJson[1]) as UserDto) : null;
      setState((s) => ({ ...s, token: token[1], user, isReady: true }));
    } catch {
      setState((s) => ({ ...s, isReady: true }));
    }
  }, []);

  useEffect(() => {
    loadStored();
  }, [loadStored]);

  const login = useCallback(
    async (body: LoginRequest) => {
      setState((s) => ({ ...s, isLoading: true }));
      try {
        const data = await authApi.login(body);
        await persistAuth(data);
        setState((s) => ({ ...s, user: data.user, token: data.accessToken, isLoading: false }));
        router.replace('/(tabs)');
      } catch (e) {
        setState((s) => ({ ...s, isLoading: false }));
        throw e;
      }
    },
    [router]
  );

  const register = useCallback(async (body: RegisterStartRequest) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await authApi.register(body);
      setState((s) => ({ ...s, isLoading: false }));
      return { email: res.email };
    } catch (e) {
      setState((s) => ({ ...s, isLoading: false }));
      throw e;
    }
  }, []);

  const verifyOtp = useCallback(
    async (body: VerifyOtpRequest) => {
      setState((s) => ({ ...s, isLoading: true }));
      try {
        const data = await authApi.verifyOtp(body);
        await persistAuth(data);
        setState((s) => ({ ...s, user: data.user, token: data.accessToken, isLoading: false }));
        router.replace('/(tabs)');
      } catch (e) {
        setState((s) => ({ ...s, isLoading: false }));
        throw e;
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    await clearAuth();
    setState({ user: null, token: null, isLoading: false, isReady: true });
    router.replace('/(auth)/login');
  }, [router]);

  const loginWithGoogle = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const { authorizationUrl, state: oauthState } = await authApi.googleStart();
      const webBrowser = await import('expo-web-browser');
      const result = await webBrowser.openAuthSessionAsync(
        authorizationUrl,
        undefined,
        { showInRecents: true }
      );
      if (result.type !== 'success' || !result.url) {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }
      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      const stateParam = url.searchParams.get('state');
      if (!code || !stateParam || stateParam !== oauthState) {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }
      const data = await authApi.googleCallback({ code, state: stateParam });
      await persistAuth(data);
      setState((s) => ({ ...s, user: data.user, token: data.accessToken, isLoading: false }));
      router.replace('/(tabs)');
    } catch (e) {
      setState((s) => ({ ...s, isLoading: false }));
      throw e;
    }
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      verifyOtp,
      logout,
      loginWithGoogle,
    }),
    [state, login, register, verifyOtp, logout, loginWithGoogle]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
