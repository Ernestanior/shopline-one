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
  
  // Payment environment
  PAYMENT_ENVIRONMENT?: string;
  
  // Payment Gateway - NewebPay (Test)
  NEWEBPAY_TEST_MERCHANT_ID?: string;
  NEWEBPAY_TEST_HASH_KEY?: string;
  NEWEBPAY_TEST_HASH_IV?: string;
  
  // Payment Gateway - NewebPay (Production)
  NEWEBPAY_PROD_MERCHANT_ID?: string;
  NEWEBPAY_PROD_HASH_KEY?: string;
  NEWEBPAY_PROD_HASH_IV?: string;
  
  // Payment Gateway - NewebPay (Common)
  NEWEBPAY_VERSION?: string;
  
  // Payment Gateway - ECPay (Test)
  ECPAY_TEST_MERCHANT_ID?: string;
  ECPAY_TEST_HASH_KEY?: string;
  ECPAY_TEST_HASH_IV?: string;
  
  // Payment Gateway - ECPay (Production)
  ECPAY_PROD_MERCHANT_ID?: string;
  ECPAY_PROD_HASH_KEY?: string;
  ECPAY_PROD_HASH_IV?: string;
  
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
