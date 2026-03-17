import { config } from './config';
import { authenticatedRequest } from './api';

export type CartItemDto = {
  cartItemId: string;
  variantId: string;
  productId: string;
  productName?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
  productImageUrl?: string | null;
};

export type CartDto = {
  cartId: string;
  totalAmount: number;
  status?: string | null;
  userId: string;
  cartItems: CartItemDto[];
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[] | null;
};

export async function addCartItem(
  token: string,
  body: { variantId: string; quantity: number }
): Promise<CartDto> {
  const url = `${config.apiBaseUrl}/api/Carts/items`;
  const res = await authenticatedRequest<ApiResponse<CartDto>>(url, {
    method: 'POST',
    token,
    body: JSON.stringify({
      variantId: body.variantId,
      quantity: body.quantity,
    }),
  });
  if (!res.success || !res.data) throw new Error(res.message || 'Thêm vào giỏ thất bại');
  return res.data;
}

export async function clearBeCart(token: string): Promise<void> {
  const url = `${config.apiBaseUrl}/api/Carts/clear`;
  await authenticatedRequest<ApiResponse<unknown>>(url, {
    method: 'DELETE',
    token,
  });
}
