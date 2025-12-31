import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * CSRF Protection Middleware
 * 
 * Implements CSRF token validation using double-submit cookie pattern:
 * - Generates CSRF token on GET requests
 * - Validates token on state-changing requests (POST, PUT, DELETE, PATCH)
 * - Uses SameSite cookie attribute for additional protection
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly tokenLength = 32;
  private readonly cookieName = 'XSRF-TOKEN';
  private readonly headerName = 'X-XSRF-TOKEN';

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // Generate and set CSRF token
      const token = this.generateToken();
      res.cookie(this.cookieName, token, {
        httpOnly: false, // Must be readable by JavaScript for header
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000, // 1 hour
      });
      return next();
    }

    // Validate CSRF token for state-changing requests
    const cookieToken = req.cookies?.[this.cookieName];
    const headerToken = req.headers[this.headerName.toLowerCase()] as string;

    if (!cookieToken || !headerToken) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_MISSING',
          message: 'CSRF token is missing',
        },
      });
    }

    if (cookieToken !== headerToken) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_MISMATCH',
          message: 'CSRF token mismatch',
        },
      });
    }

    next();
  }

  private generateToken(): string {
    return crypto.randomBytes(this.tokenLength).toString('hex');
  }
}

