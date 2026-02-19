/**
 * CSRF Protection Middleware
 * 
 * Implements Cross-Site Request Forgery protection for payment endpoints.
 * Uses token-based validation to ensure requests originate from legitimate sources.
 */

import { Context, Next } from 'hono';
import { sha256 } from '../utils/crypto';

interface CSRFConfig {
  secret: string;
  tokenLength?: number;
  headerName?: string;
  cookieName?: string;
}

const DEFAULT_CONFIG: Partial<CSRFConfig> = {
  tokenLength: 32,
  headerName: 'X-CSRF-Token',
  cookieName: 'csrf_token',
};

/**
 * Generate a CSRF token
 * 
 * @param secret - Secret key for token generation
 * @param sessionId - User session identifier
 * @returns CSRF token
 */
export async function generateCSRFToken(secret: string, sessionId: string): Promise<string> {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  const randomString = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const data = `${sessionId}:${timestamp}:${randomString}`;
  const signature = await sha256(`${secret}:${data}`);
  
  return `${data}:${signature}`;
}

/**
 * Verify a CSRF token
 * 
 * @param token - CSRF token to verify
 * @param secret - Secret key for verification
 * @param sessionId - User session identifier
 * @param maxAge - Maximum token age in milliseconds (default: 1 hour)
 * @returns true if token is valid
 */
export async function verifyCSRFToken(
  token: string,
  secret: string,
  sessionId: string,
  maxAge: number = 3600000
): Promise<boolean> {
  try {
    const parts = token.split(':');
    if (parts.length !== 4) {
      return false;
    }
    
    const [tokenSessionId, timestamp, randomString, signature] = parts;
    
    // Verify session ID matches
    if (tokenSessionId !== sessionId) {
      return false;
    }
    
    // Verify token is not expired
    const tokenTime = parseInt(timestamp);
    if (isNaN(tokenTime) || Date.now() - tokenTime > maxAge) {
      return false;
    }
    
    // Verify signature
    const data = `${tokenSessionId}:${timestamp}:${randomString}`;
    const expectedSignature = await sha256(`${secret}:${data}`);
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('CSRF token verification error:', error);
    return false;
  }
}

/**
 * CSRF protection middleware
 * 
 * Validates CSRF tokens for state-changing requests (POST, PUT, DELETE, PATCH)
 */
export function csrfProtection(config: CSRFConfig) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  return async (c: Context, next: Next) => {
    const method = c.req.method.toUpperCase();
    
    // Skip CSRF check for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      await next();
      return;
    }
    
    // Get session ID from user context or cookie
    const sessionId = getSessionId(c);
    if (!sessionId) {
      return c.json(
        {
          error: 'Unauthorized',
          message: 'Session not found',
        },
        401
      );
    }
    
    // Get CSRF token from header or body
    const token = c.req.header(fullConfig.headerName!) || 
                  (await getTokenFromBody(c));
    
    if (!token) {
      return c.json(
        {
          error: 'Forbidden',
          message: 'CSRF token missing',
        },
        403
      );
    }
    
    // Verify token
    const isValid = await verifyCSRFToken(
      token,
      config.secret,
      sessionId
    );
    
    if (!isValid) {
      return c.json(
        {
          error: 'Forbidden',
          message: 'Invalid CSRF token',
        },
        403
      );
    }
    
    await next();
  };
}

/**
 * Middleware to generate and attach CSRF token to response
 */
export function attachCSRFToken(config: CSRFConfig) {
  return async (c: Context, next: Next) => {
    const sessionId = getSessionId(c);
    
    if (sessionId) {
      const token = await generateCSRFToken(config.secret, sessionId);
      
      // Attach token to response headers
      c.header('X-CSRF-Token', token);
      
      // Optionally set as cookie
      if (config.cookieName) {
        c.header(
          'Set-Cookie',
          `${config.cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Secure`
        );
      }
    }
    
    await next();
  };
}

/**
 * Get session ID from context
 */
function getSessionId(c: Context): string | null {
  // Try to get from authenticated user
  const user = c.get('user');
  if (user && user.id) {
    return user.id.toString();
  }
  
  // Try to get from session cookie
  const sessionCookie = c.req.header('cookie');
  if (sessionCookie) {
    const match = sessionCookie.match(/session_id=([^;]+)/);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Get CSRF token from request body
 */
async function getTokenFromBody(c: Context): Promise<string | null> {
  try {
    const contentType = c.req.header('content-type');
    
    if (contentType?.includes('application/json')) {
      const body = await c.req.json() as { csrf_token?: string };
      return body.csrf_token || null;
    }
    
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const body = await c.req.parseBody();
      return (body.csrf_token as string) || null;
    }
  } catch (error) {
    console.error('Error parsing request body for CSRF token:', error);
  }
  
  return null;
}
