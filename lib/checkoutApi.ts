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
  provinceId?: number;
  toDistrictId?: number;
  toWardCode: string;
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

export async function previewCheckout(
  token: string,
  request: CheckoutPreviewRequest
): Promise<CheckoutPreviewDto> {
  const url = `${config.apiBaseUrl}/api/Orders/checkout/preview`;
  const res = await authenticatedRequest<ApiResponse<CheckoutPreviewDto>>(url, {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  });
  if (!res.success || !res.data) throw new Error(res.message || 'Tạo xem trước đơn hàng thất bại');
  return res.data;
}

export async function checkout(
  token: string,
  request: CheckoutOrderRequest
): Promise<CheckoutOrderResultDto> {
  const url = `${config.apiBaseUrl}/api/Orders/checkout`;
  const res = await authenticatedRequest<ApiResponse<CheckoutOrderResultDto>>(url, {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  });
  if (!res.success || !res.data) throw new Error(res.message || 'Đặt hàng thất bại');
  return res.data;
}
