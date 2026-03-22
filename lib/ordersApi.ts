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

/** Lấy shipment hiện tại theo order */
export async function getShipment(
  orderId: string,
  token: string
): Promise<ApiResponse<ShipmentDto>> {
  const url = `${config.apiBaseUrl}/api/Orders/${orderId}/shipment`;
  return authenticatedRequest<ApiResponse<ShipmentDto>>(url, {
    method: 'GET',
    token,
  });
}

/** Đồng bộ trạng thái từ GHN thủ công (nút refresh) */
export async function syncShipmentStatus(
  orderId: string,
  token: string
): Promise<ApiResponse<ShipmentDto>> {
  const url = `${config.apiBaseUrl}/api/Orders/${orderId}/shipment/sync`;
  return authenticatedRequest<ApiResponse<ShipmentDto>>(url, {
    method: 'POST',
    token,
  });
}

/** Đồng bộ tất cả shipment (cho admin/staff) */
export async function syncAllShipments(
  token: string
): Promise<ApiResponse<{ totalCandidates: number; syncedCount: number; failedCount: number; syncedAt: string; failures: Array<{ orderId: string; ghnOrderCode?: string; error: string }> }>> {
  const url = `${config.apiBaseUrl}/api/Orders/shipments/sync-all`;
  return authenticatedRequest(url, {
    method: 'POST',
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
