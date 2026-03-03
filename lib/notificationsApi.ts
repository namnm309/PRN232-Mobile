import { config } from './config';
import { authenticatedRequest } from './api';

export type NotificationDto = {
  notificationId: string;
  title: string | null;
  content: string | null;
  type: string | null;
  isRead: boolean;
  createdAt: string;
  userId: string;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[] | null;
};

export async function getNotifications(
  token: string,
  userId: string,
  pageNumber: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<PagedResult<NotificationDto>>> {
  const url = `${config.apiBaseUrl}/api/Notifications?userId=${encodeURIComponent(userId)}&pageNumber=${pageNumber}&pageSize=${pageSize}`;
  return authenticatedRequest<ApiResponse<PagedResult<NotificationDto>>>(url, {
    method: 'GET',
    token,
  });
}

export async function markNotificationAsRead(
  notificationId: string,
  token: string
): Promise<void> {
  const url = `${config.apiBaseUrl}/api/Notifications/${notificationId}/read`;
  await authenticatedRequest<void>(url, {
    method: 'PATCH',
    token,
  });
}
