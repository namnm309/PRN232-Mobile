import { config, getAuthUrl } from './config';

export type UserDto = {
  id: string;
  email: string;
  phoneNumber: string | null;
  displayName: string | null;
  provider: string;
  createdAt: string;
  isActive: boolean;
  lastLoginAt: string | null;
};

export type AuthResponse = {
  accessToken: string;
  user: UserDto;
};

export type LoginRequest = { email: string; password: string };

export type RegisterStartRequest = {
  email: string;
  phoneNumber?: string;
  displayName?: string;
  password: string;
  confirmPassword: string;
};

export type VerifyOtpRequest = {
  email: string;
  otp: string;
  displayName?: string;
  phoneNumber?: string;
};

export type GoogleOAuthStartResponse = {
  authorizationUrl: string;
  state: string;
};

export type GoogleOAuthCallbackRequest = { code: string; state: string; redirectUri?: string };
export type GoogleMobileLoginRequest = { idToken: string };

async function request<T>(
  url: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json; charset=utf-8',
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...init, headers });
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    let message: string =
      (data?.detail as string) ??
      (data?.message as string) ??
      (data?.title as string) ??
      `HTTP ${res.status}`;
    const errArr = data?.errors as string[] | undefined;
    if (Array.isArray(errArr) && errArr.length > 0) {
      message = errArr.join('; ');
    } else if (typeof message !== 'string') {
      message = Array.isArray(message) ? message.join('; ') : String(message ?? `HTTP ${res.status}`);
    }
    if (res.status === 401) {
      message =
        'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng xuất và đăng nhập lại.';
    }
    throw new Error(message);
  }
  return data as T;
}

export const authApi = {
  login: (body: LoginRequest) =>
    request<AuthResponse>(getAuthUrl('/login'), { method: 'POST', body: JSON.stringify(body) }),

  register: (body: RegisterStartRequest) =>
    request<{ message: string; email: string }>(getAuthUrl('/register'), {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  verifyOtp: (body: VerifyOtpRequest) =>
    request<AuthResponse>(getAuthUrl('/email/verify-otp'), {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  requestOtp: (email: string) =>
    request<void>(getAuthUrl('/email/request-otp'), {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  googleMobileLogin: (idToken: string) =>
    request<AuthResponse>(getAuthUrl('/google/mobile'), {
      method: 'POST',
      body: JSON.stringify({ idToken } satisfies GoogleMobileLoginRequest),
    }),

  changePassword: (currentPassword: string, newPassword: string, token: string) =>
    request<{ message?: string }>(getAuthUrl('/change-password'), {
      method: 'POST',
      token,
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    }),
};

/** For authenticated or anonymous requests */
export async function authenticatedRequest<T>(
  path: string,
  options: RequestInit & { token?: string }
): Promise<T> {
  const url = path.startsWith('http') ? path : `${config.apiBaseUrl}${path}`;
  return request<T>(url, { ...options, token: options.token });
}
