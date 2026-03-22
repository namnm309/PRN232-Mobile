import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
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
import { updateUserMe, extractUser, type UpdateUserRequest } from '@/lib/userApi';

const GOOGLE_CLIENT_ID =
  '869531482598-t4c2ufqbq0sl42m97eqd7dg5e5vjb7m3.apps.googleusercontent.com';

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
  updateUser: (body: UpdateUserRequest) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const { token } = state;
      if (!token) throw new Error('Chưa đăng nhập');
      await authApi.changePassword(currentPassword, newPassword, token);
    },
    [state.token]
  );

  const updateUser = useCallback(async (body: UpdateUserRequest) => {
    const { token, user } = state;
    if (!token || !user) throw new Error('Chưa đăng nhập');
    const res = await updateUserMe(token, body);
    const updated = extractUser(res);
    const merged = updated ?? {
      ...user,
      displayName: body.displayName ?? user.displayName,
      phoneNumber: body.phoneNumber ?? user.phoneNumber,
      email: body.email ?? user.email,
    };
    setState((s) => ({ ...s, user: merged }));
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(merged));
  }, [state.token, state.user]);

  const loginWithGoogle = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      // Sử dụng proxy của Expo (auth.expo.io) với project full name @owner/slug
      const redirectUri = AuthSession.makeRedirectUri({
        path: 'redirect',
        // @ts-expect-error projectNameForProxy được hỗ trợ runtime bởi Expo
        projectNameForProxy: '@namnm309/NongXanh',
      });
      const nonce = Math.random().toString(36).substring(2);

      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        redirectUri,
        // Google không cho dùng PKCE (code_challenge_method) với flow id_token thuần
        usePKCE: false,
        responseType: AuthSession.ResponseType.IdToken,
        scopes: ['openid', 'email', 'profile'],
        extraParams: {
          nonce,
        },
      });

      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      };

      const result = (await request.promptAsync(discovery)) as AuthSession.AuthSessionResult;

      if (result.type !== 'success' || !('params' in result) || !result.params.id_token) {
        setState((s) => ({ ...s, isLoading: false }));
        if (result.type === 'error' && 'error' in result && result.error) {
          throw new Error(result.error.message ?? 'Google login failed');
        }
        return;
      }

      const idToken = result.params.id_token;
      const data = await authApi.googleMobileLogin(idToken);

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
      updateUser,
      changePassword,
    }),
    [state, login, register, verifyOtp, logout, loginWithGoogle, updateUser, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
