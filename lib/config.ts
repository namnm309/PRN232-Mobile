/**
 * API base URL. Set EXPO_PUBLIC_API_URL in .env or app config.
 * Default: Azure backend.
 */
const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net';

export const config = {
  apiBaseUrl: API_BASE_URL,
  authPath: '/api/auth',
} as const;

export function getAuthUrl(path: string): string {
  return `${config.apiBaseUrl}${config.authPath}${path}`;
}
