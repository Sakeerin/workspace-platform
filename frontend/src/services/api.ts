import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { env } from '../config/env';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RetryableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

function clearStoredAuth() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('auth-storage');
}

function persistTokens(tokens: TokenPair) {
  localStorage.setItem('access_token', tokens.accessToken);
  localStorage.setItem('refresh_token', tokens.refreshToken);

  const storedAuth = localStorage.getItem('auth-storage');
  if (!storedAuth) {
    return;
  }

  try {
    const parsed = JSON.parse(storedAuth);
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        ...parsed,
        state: {
          ...parsed.state,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      })
    );
  } catch {
    localStorage.removeItem('auth-storage');
  }
}

class ApiService {
  private client: AxiosInstance;
  private refreshPromise: Promise<TokenPair> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: env.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<any>) => {
        const status = error.response?.status;
        const errorData = error.response?.data;
        const originalRequest = error.config as RetryableRequestConfig | undefined;

        // Handle specific HTTP status codes
        switch (status) {
          case 401:
            if (
              originalRequest &&
              !originalRequest._retry &&
              !originalRequest.url?.includes('/auth/refresh') &&
              this.hasRefreshToken()
            ) {
              originalRequest._retry = true;

              try {
                const tokens = await this.refreshTokens();
                originalRequest.headers = {
                  ...originalRequest.headers,
                  Authorization: `Bearer ${tokens.accessToken}`,
                };
                return this.client(originalRequest);
              } catch {
                // Fall through to clear auth and redirect below.
              }
            }

            clearStoredAuth();
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
              window.location.href = '/login';
            }
            error.message = errorData?.error?.message || 'Your session has expired. Please log in again.';
            break;

          case 403:
            // Forbidden
            error.message = errorData?.error?.message || 'You do not have permission to perform this action.';
            break;

          case 404:
            // Not Found
            error.message = errorData?.error?.message || 'The requested resource was not found.';
            break;

          case 409:
            // Conflict
            error.message = errorData?.error?.message || 'This resource already exists or conflicts with existing data.';
            break;

          case 422:
            // Validation Error
            const validationErrors = errorData?.error?.details || errorData?.errors;
            if (validationErrors) {
              const errorMessages = Array.isArray(validationErrors)
                ? validationErrors.map((e: any) => e.message || e).join(', ')
                : Object.values(validationErrors).flat().join(', ');
              error.message = errorMessages || 'Validation failed. Please check your input.';
            } else {
              error.message = errorData?.error?.message || 'Validation failed. Please check your input.';
            }
            break;

          case 429:
            // Too Many Requests
            error.message = errorData?.error?.message || 'Too many requests. Please wait a moment and try again.';
            break;

          case 500:
            // Internal Server Error
            error.message = errorData?.error?.message || 'An internal server error occurred. Please try again later.';
            break;

          case 503:
            // Service Unavailable
            error.message = errorData?.error?.message || 'The service is temporarily unavailable. Please try again later.';
            break;

          default:
            // Network errors or other issues
            if (!error.response) {
              if (error.code === 'ECONNABORTED') {
                error.message = 'Request timeout. Please check your connection and try again.';
              } else if (error.message === 'Network Error') {
                error.message = 'Network error. Please check your internet connection.';
              } else {
                error.message = 'Unable to connect to the server. Please try again later.';
              }
            } else {
              // Extract error message from response
              error.message = errorData?.error?.message || errorData?.message || error.message || 'An unexpected error occurred.';
            }
        }

        // Log error for debugging (in development)
        if (import.meta.env.DEV) {
          console.error('API Error:', {
            status,
            message: error.message,
            url: error.config?.url,
            method: error.config?.method,
            data: errorData,
          });
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  private hasRefreshToken() {
    return Boolean(localStorage.getItem('refresh_token'));
  }

  private async refreshTokens(): Promise<TokenPair> {
    if (!this.refreshPromise) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return Promise.reject(new Error('No refresh token available'));
      }

      this.refreshPromise = axios
        .post<{ success: boolean; data: { tokens: TokenPair } }>(
          `${env.apiUrl}/auth/refresh`,
          { refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        )
        .then((response) => {
          const { tokens } = response.data.data;
          persistTokens(tokens);
          return tokens;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
  }
}

export const api = new ApiService();
export default api;

