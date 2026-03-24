import { config } from './config';
import { authenticatedRequest } from './api';

export type ReviewDto = {
  reviewId: string;
  productId: string;
  userId: string;
  ratingValue: number;
  comment: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string | null;
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

export async function getReviewsByProductId(
  productId: string,
  pageNumber: number = 1,
  pageSize: number = 10,
  token?: string
): Promise<ApiResponse<PagedResult<ReviewDto>>> {
  const url = `${config.apiBaseUrl}/api/Reviews/product/${productId}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  return authenticatedRequest<ApiResponse<PagedResult<ReviewDto>>>(url, {
    method: 'GET',
    token, // Token is optional for reviews
  });
}
