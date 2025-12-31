import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * General API Rate Limiter
 * Limits: 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Authentication Rate Limiter
 * Limits: 5 requests per 15 minutes per IP (stricter for security)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_AUTH_REQUESTS',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
  skipSuccessfulRequests: true,
});

/**
 * Search Rate Limiter
 * Limits: 30 requests per minute per IP
 */
export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_SEARCH_REQUESTS',
      message: 'Too many search requests, please try again later.',
    },
  },
});

/**
 * File Upload Rate Limiter
 * Limits: 10 uploads per hour per IP
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_UPLOADS',
      message: 'Too many file uploads, please try again later.',
    },
  },
});

/**
 * WebSocket Connection Rate Limiter
 * Limits: 5 connections per minute per IP
 */
export const websocketRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_WEBSOCKET_CONNECTIONS',
      message: 'Too many WebSocket connections, please try again later.',
    },
  },
});

/**
 * Create custom rate limiter for specific endpoints
 * @param windowMs Time window in milliseconds
 * @param max Maximum requests per window
 * @param message Custom error message
 */
export function createRateLimiter(
  windowMs: number,
  max: number,
  message?: { success: boolean; error: { code: string; message: string } }
) {
  return rateLimit({
    windowMs,
    max,
    message: message || {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests, please try again later.',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

