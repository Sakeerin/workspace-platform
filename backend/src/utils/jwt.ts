import jwt = require('jsonwebtoken');
import { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JWTService {
  private static validateSecrets() {
    if (!env.jwt.secret || env.jwt.secret.trim() === '') {
      throw new Error('JWT_SECRET is not set. Please set it in your .env file.');
    }
    if (!env.jwt.refreshSecret || env.jwt.refreshSecret.trim() === '') {
      throw new Error('JWT_REFRESH_SECRET is not set. Please set it in your .env file.');
    }
  }

  static generateAccessToken(payload: JWTPayload): string {
    this.validateSecrets();
    return jwt.sign(payload, env.jwt.secret as string, {
      expiresIn: env.jwt.expiresIn,
    } as SignOptions);
  }

  static generateRefreshToken(payload: JWTPayload): string {
    this.validateSecrets();
    return jwt.sign(payload, env.jwt.refreshSecret as string, {
      expiresIn: env.jwt.refreshExpiresIn,
    } as SignOptions);
  }

  static generateTokenPair(payload: JWTPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, env.jwt.secret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, env.jwt.refreshSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }
}

