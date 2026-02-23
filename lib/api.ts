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

export type GoogleOAuthCallbackRequest = { code: string; state: string };

async function request<T>(
  url: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...init, headers });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message ?? data?.title ?? `HTTP ${res.status}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
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

  googleStart: () => request<GoogleOAuthStartResponse>(getAuthUrl('/google/start'), { method: 'GET' }),

  googleCallback: (body: GoogleOAuthCallbackRequest) =>
    request<AuthResponse>(getAuthUrl('/google/callback'), {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

/** For authenticated requests later */
export async function authenticatedRequest<T>(
  path: string,
  options: RequestInit & { token: string }
): Promise<T> {
  const url = path.startsWith('http') ? path : `${config.apiBaseUrl}${path}`;
  return request<T>(url, { ...options, token: options.token });
}
