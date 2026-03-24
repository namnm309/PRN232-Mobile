import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
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

// Đảm bảo browser session được hoàn tất khi redirect về app
WebBrowser.maybeCompleteAuthSession();

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
      // 1. Lấy authorization URL từ backend
      const { authorizationUrl } = await authApi.googleStart();

      // 2. Mở browser — backend xử lý Google callback và redirect deep link
      //    nongxanh://auth/success?token=...&userId=...&email=...&displayName=...
      //    hoặc nongxanh://auth/error?error=...
      const result = await WebBrowser.openAuthSessionAsync(
        authorizationUrl,
        'nongxanh://'
      );

      if (result.type !== 'success' || !result.url) {
        setState((s) => ({ ...s, isLoading: false }));
        if (result.type === 'cancel' || result.type === 'dismiss') return;
        throw new Error('Google login failed');
      }

      // 3. Parse deep link params
      const url = new URL(result.url);
      const params = url.searchParams;

      // Check lỗi từ backend
      const error = params.get('error');
      if (error) {
        throw new Error(decodeURIComponent(error));
      }

      const accessToken = params.get('token');
      const userId = params.get('userId');
      const email = params.get('email');
      const displayName = params.get('displayName');

      if (!accessToken || !userId || !email) {
        throw new Error('Thiếu thông tin từ server');
      }

      const user: UserDto = {
        id: userId,
        email: decodeURIComponent(email),
        phoneNumber: null,
        displayName: displayName ? decodeURIComponent(displayName) : null,
        provider: 'Google',
        createdAt: new Date().toISOString(),
        isActive: true,
        lastLoginAt: new Date().toISOString(),
      };

      const authData: AuthResponse = { accessToken, user };
      await persistAuth(authData);
      setState((s) => ({ ...s, user, token: accessToken, isLoading: false }));
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
