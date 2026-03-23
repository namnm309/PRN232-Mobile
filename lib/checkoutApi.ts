import { config } from './config';
import { authenticatedRequest } from './api';

export type CheckoutItemDto = {
  cartItemId: string;
  variantId: string;
  productName?: string | null;
  variantName?: string | null;
  quantity: number;
  unitPrice: number;
  subTotal: number;
};

export type CheckoutPreviewDto = {
  items: CheckoutItemDto[];
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  finalAmount: number;
  voucherCode?: string | null;
};

export type CheckoutPreviewRequest = {
  cartItemIds: string[];
  provinceId?: number;
  toDistrictId?: number;
  toWardCode?: string;
  insuranceValue?: number;
  voucherCode?: string | null;
};

export type CheckoutOrderRequest = {
  cartItemIds: string[];
  shippingAddress: string;
  shippingMethod: string;
  paymentMethod: string;
  recipientName: string;
  recipientPhone: string;
  provinceCode: string;
  provinceId: number;
  toWardCode: string;
  toDistrictId?: number;
  insuranceValue?: number;
  voucherCode?: string | null;
};

export type CheckoutOrderResultDto = {
  order: {
    orderId: string;
    orderNumber?: string | null;
    orderDate: string;
    totalAmount: number;
    shippingFee: number;
    discountAmount: number;
    finalAmount: number;
    shippingAddress?: string | null;
    status?: string | null;
    vnPayStatus?: string | null;
  };
  payment: {
    paymentId: string;
    orderId: string;
    paymentMethod?: string | null;
    paymentStatus?: string | null;
  };
  shipment?: unknown;
  paymentUrl?: string | null;
  vnPayTransactionRef?: string | null;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[] | null;
};

/** Chuẩn hóa request - camelCase theo Swagger/OpenAPI */
function sanitizePreviewRequest(r: CheckoutPreviewRequest): Record<string, unknown> {
  const cartItemIds = Array.isArray(r.cartItemIds)
    ? r.cartItemIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : [];
  const body: Record<string, unknown> = {
    cartItemIds,
    provinceId: r.provinceId != null ? Math.floor(Number(r.provinceId)) : undefined,
    toDistrictId: r.toDistrictId != null ? Math.floor(Number(r.toDistrictId)) : undefined,
    toWardCode: typeof r.toWardCode === 'string' ? r.toWardCode : undefined,
    insuranceValue: Math.max(0, r.insuranceValue != null ? Number(r.insuranceValue) : 0),
    voucherCode: typeof r.voucherCode === 'string' && r.voucherCode ? r.voucherCode : undefined,
  };
  return Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined));
}

/** Chuẩn hóa request checkout - camelCase */
function sanitizeOrderRequest(r: CheckoutOrderRequest): Record<string, unknown> {
  const cartItemIds = Array.isArray(r.cartItemIds)
    ? r.cartItemIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : [];
  const body: Record<string, unknown> = {
    cartItemIds,
    shippingAddress: String(r.shippingAddress ?? ''),
    shippingMethod: String(r.shippingMethod ?? 'road'),
    paymentMethod: String(r.paymentMethod ?? 'COD'),
    recipientName: String(r.recipientName ?? ''),
    recipientPhone: String(r.recipientPhone ?? ''),
    provinceCode: String(r.provinceCode ?? ''),
    provinceId: r.provinceId != null ? Math.floor(Number(r.provinceId)) : undefined,
    toDistrictId: r.toDistrictId != null ? Math.floor(Number(r.toDistrictId)) : undefined,
    toWardCode: String(r.toWardCode ?? ''),
    insuranceValue: Math.max(0, r.insuranceValue != null ? Number(r.insuranceValue) : 0),
    voucherCode: typeof r.voucherCode === 'string' && r.voucherCode ? r.voucherCode : undefined,
  };
  return Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined));
}

export async function previewCheckout(
  token: string,
  request: CheckoutPreviewRequest
): Promise<CheckoutPreviewDto> {
  const url = `${config.apiBaseUrl}/api/Orders/checkout/preview`;
  const body = sanitizePreviewRequest(request);
  const res = await authenticatedRequest<ApiResponse<CheckoutPreviewDto>>(url, {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
  if (!res.success || !res.data) throw new Error(res.message || 'Tạo xem trước đơn hàng thất bại');
  return res.data;
}

export async function checkout(
  token: string,
  request: CheckoutOrderRequest
): Promise<CheckoutOrderResultDto> {
  const url = `${config.apiBaseUrl}/api/Orders/checkout`;
  const body = sanitizeOrderRequest(request);
  const res = await authenticatedRequest<ApiResponse<CheckoutOrderResultDto>>(url, {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
  if (!res.success || !res.data) throw new Error(res.message || 'Đặt hàng thất bại');
  return res.data;
}
