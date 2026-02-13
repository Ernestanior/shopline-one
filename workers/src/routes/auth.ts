/**
 * Authentication Routes
 * Handles user registration, login, logout, and current user
 */

import { Hono } from 'hono';
import { DatabaseService } from '../services/db.service';
import { hashPassword, verifyPassword, issueToken } from '../services/auth.service';
import { setAuthCookie, clearAuthCookie, getCurrentUser } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { ValidationError, UnauthorizedError } from '../middleware/error';
import type { Env } from '../types/env';

const auth = new Hono<{ Bindings: Env }>();

// Register
auth.post('/register', validate(schemas.register), async (c) => {
  const { email, password } = c.get('validatedData');
  const db = new DatabaseService(c.env.DB);

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // Check if user exists
  const existing = await db.queryOne(
    'SELECT id FROM users WHERE email = ?',
    [normalizedEmail]
  );

  if (existing) {
    throw new ValidationError('Email already registered');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const result = await db.execute(
    'INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, ?)',
    [normalizedEmail, passwordHash, 0]
  );

  const userId = db.getLastInsertId(result);

  // Issue token
  const token = await issueToken(
    { id: userId!, email: normalizedEmail, is_admin: 0 },
    c.env.JWT_SECRET
  );

  setAuthCookie(c, token);

  return c.json({
    token, // Add token to response
    user: {
      id: userId,
      email: normalizedEmail,
      is_admin: 0
    }
  }, 201);
});

// Login
auth.post('/login', validate(schemas.login), async (c) => {
  const { email, password } = c.get('validatedData');
  const db = new DatabaseService(c.env.DB);

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // Get user
  const user = await db.queryOne<{
    id: number;
    email: string;
    password_hash: string;
    is_admin: number;
  }>(
    'SELECT id, email, password_hash, is_admin FROM users WHERE email = ?',
    [normalizedEmail]
  );

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Issue token
  const token = await issueToken(
    { id: user.id, email: user.email, is_admin: user.is_admin },
    c.env.JWT_SECRET
  );

  setAuthCookie(c, token);

  return c.json({
    token, // Add token to response
    user: {
      id: user.id,
      email: user.email,
      is_admin: user.is_admin
    }
  });
});

// Logout
auth.post('/logout', (c) => {
  clearAuthCookie(c);
  return c.json({ ok: true });
});

// Get current user
auth.get('/me', async (c) => {
  const user = getCurrentUser(c);

  if (!user) {
    throw new UnauthorizedError();
  }

  const db = new DatabaseService(c.env.DB);

  // Get fresh user data
  const userData = await db.queryOne<{
    id: number;
    email: string;
    is_admin: number;
  }>(
    'SELECT id, email, is_admin FROM users WHERE id = ?',
    [user.id]
  );

  if (!userData) {
    throw new UnauthorizedError();
  }

  return c.json({ user: userData });
});

export { auth as authRoutes };
