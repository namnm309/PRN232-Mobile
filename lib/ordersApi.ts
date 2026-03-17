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

export type ShipmentDto = {
  shipmentId?: string;
  ghnOrderCode?: string | null;
  deliveryStatus?: string | null;
  rawStatus?: string | null;
  trackingUrl?: string | null;
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
  deliveryStatus?: string | null;
  userId: string;
  orderDetails: OrderDetailDto[] | null;
  shipment?: ShipmentDto | null;
};

export type GhnStatusSyncResponseDto = {
  orderId: string;
  ghnOrderCode: string;
  ghnStatus: string;
  orderStatus: string;
  previousOrderStatus: string;
  statusChanged: boolean;
  trackingUrl?: string | null;
};

export async function syncGhnStatus(
  orderId: string,
  token: string
): Promise<ApiResponse<GhnStatusSyncResponseDto>> {
  const url = `${config.apiBaseUrl}/api/Orders/${orderId}/ghn-status`;
  return authenticatedRequest<ApiResponse<GhnStatusSyncResponseDto>>(url, {
    method: 'GET',
    token,
  });
}

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
