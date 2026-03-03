import { config } from './config';
import { authenticatedRequest } from './api';
import type { UserDto } from './api';

export type UpdateUserRequest = {
  email?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  isActive?: boolean | null;
};

export type UserApiResponse = {
  success: boolean;
  message: string;
  data: UserDto | null;
  errors: string[] | null;
};

/** Lấy thông tin user hiện tại - trả về UserDto hoặc ApiResponse */
export async function getUserMe(token: string): Promise<UserDto | UserApiResponse> {
  const url = `${config.apiBaseUrl}/api/users/me`;
  return authenticatedRequest<UserDto | UserApiResponse>(url, {
    method: 'GET',
    token,
  });
}

/** Cập nhật thông tin user hiện tại (PUT) - backend có thể trả về UserDto trực tiếp hoặc ApiResponse */
export async function updateUserMe(
  token: string,
  body: UpdateUserRequest
): Promise<UserDto | UserApiResponse> {
  const url = `${config.apiBaseUrl}/api/users/me`;
  return authenticatedRequest<UserDto | UserApiResponse>(url, {
    method: 'PUT',
    token,
    body: JSON.stringify(body),
  });
}

/** Trích xuất UserDto từ response (hỗ trợ cả format trực tiếp và ApiResponse) */
export function extractUser(res: UserDto | UserApiResponse): UserDto | null {
  if (!res) return null;
  if ('data' in res && res.data) return res.data;
  if ('id' in res && typeof res.id === 'string') return res as UserDto;
  return null;
}
