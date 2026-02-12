/**
 * Environment bindings and types for Cloudflare Workers
 */

export interface Env {
  // D1 Database binding
  DB: D1Database;
  
  // R2 Storage binding
  R2_BUCKET: R2Bucket;
  
  // Environment variables
  JWT_SECRET: string;
  ALLOWED_ORIGINS: string;
}

export interface User {
  id: number;
  email: string;
  is_admin: number;
}

export interface JWTPayload {
  sub: string;
  email: string;
  is_admin: number;
  exp: number;
}
