import { config } from './config';
import { authenticatedRequest } from './api';

export type OrderDetailDto = {
  orderDetailId?: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
};

export type OrderDto = {
  orderId: string;
  orderNumber: string | null;
  orderDate: string;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  finalAmount: number;
  shippingAddress: string | null;
  status: string | null;
  vnPayStatus: string | null;
  userId: string;
  orderDetails: OrderDetailDto[] | null;
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

export async function getOrders(
  token: string,
  pageNumber: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PagedResult<OrderDto>>> {
  const url = `${config.apiBaseUrl}/api/Orders?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  return authenticatedRequest<ApiResponse<PagedResult<OrderDto>>>(url, {
    method: 'GET',
    token,
  });
}

export async function getOrderById(
  orderId: string,
  token: string
): Promise<ApiResponse<OrderDto>> {
  const url = `${config.apiBaseUrl}/api/Orders/${orderId}`;
  return authenticatedRequest<ApiResponse<OrderDto>>(url, {
    method: 'GET',
    token,
  });
}
