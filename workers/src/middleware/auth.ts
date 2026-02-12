/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

import { Context, Next } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { verifyToken, getUserFromPayload } from '../services/auth.service';
import type { Env, User } from '../types/env';

const AUTH_COOKIE_NAME = 'shop_auth';

/**
 * Authentication middleware
 * Extracts and verifies JWT token from cookie, attaches user to context
 */
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  // Initialize user as null
  c.set('user', null);

  // Get token from cookie
  const token = getCookie(c, AUTH_COOKIE_NAME);
  
  if (!token) {
    return next();
  }

  // Verify token
  const payload = await verifyToken(token, c.env.JWT_SECRET);
  
  if (payload) {
    const user = getUserFromPayload(payload);
    c.set('user', user);
  }

  return next();
}

/**
 * Require authentication middleware
 * Returns 401 if user is not authenticated
 */
export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const user = c.get('user') as User | null;

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  return next();
}

/**
 * Require admin middleware
 * Returns 403 if user is not an admin
 */
export async function requireAdmin(c: Context<{ Bindings: Env }>, next: Next) {
  const user = c.get('user') as User | null;

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (!user.is_admin) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  return next();
}

/**
 * Set authentication cookie
 */
export function setAuthCookie(c: Context, token: string) {
  setCookie(c, AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true, // Always use secure in production
    sameSite: 'None', // Changed from 'Lax' to 'None' for cross-site cookies
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  });
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie(c: Context) {
  deleteCookie(c, AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'None', // Match the setting in setAuthCookie
    path: '/'
  });
}

/**
 * Get current user from context
 */
export function getCurrentUser(c: Context<{ Bindings: Env }>): User | null {
  return c.get('user') as User | null;
}
