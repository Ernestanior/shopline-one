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
  CSRF_SECRET?: string;
  
  // Payment Gateway - NewebPay
  NEWEBPAY_MERCHANT_ID?: string;
  NEWEBPAY_HASH_KEY?: string;
  NEWEBPAY_HASH_IV?: string;
  NEWEBPAY_API_URL?: string;
  NEWEBPAY_VERSION?: string;
  
  // Payment Gateway - ECPay
  ECPAY_MERCHANT_ID?: string;
  ECPAY_HASH_KEY?: string;
  ECPAY_HASH_IV?: string;
  ECPAY_API_URL?: string;
  
  // Frontend URL for payment returns
  FRONTEND_URL?: string;
  API_URL?: string;
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
