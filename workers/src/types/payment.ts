/**
 * Payment Gateway Types and Interfaces
 */

// ============================================================================
// Enums
// ============================================================================

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  ATM = 'atm',
  CONVENIENCE_STORE = 'cvs',
  BARCODE = 'barcode'
}

export enum PaymentGatewayType {
  NEWEBPAY = 'newebpay',
  ECPAY = 'ecpay'
}

export enum RefundStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed'
}

// ============================================================================
// Database Models
// ============================================================================

export interface PaymentTransaction {
  id: string;
  order_id: string;
  gateway: string;
  gateway_transaction_id: string | null;
  amount: number; // Amount in cents
  currency: string;
  payment_method: string;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  expired_at: string | null;
}

export interface PaymentCallback {
  id: number;
  transaction_id: string;
  gateway: string;
  callback_data: string; // JSON string
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface PaymentRefund {
  id: string;
  transaction_id: string;
  amount: number; // Amount in cents
  reason: string | null;
  status: RefundStatus;
  gateway_refund_id: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface PaymentSecurityLog {
  id: number;
  event_type: string;
  gateway: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_data: string | null; // JSON string
  created_at: string;
}

// ============================================================================
// Payment Gateway Interface
// ============================================================================

export interface PaymentGateway {
  name: string;
  createPayment(params: PaymentRequest): Promise<PaymentResponse>;
  verifyCallback(data: CallbackData): boolean;
  parseCallback(data: CallbackData): PaymentResult;
  queryPayment(transactionId: string): Promise<PaymentStatus>;
  refund(params: RefundRequest): Promise<RefundResponse>;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface PaymentRequest {
  orderId: string;
  amount: number; // Amount in cents
  currency: string;
  description: string;
  buyerEmail: string;
  paymentMethod: PaymentMethod;
  returnUrl: string;
  notifyUrl: string;
  expireDate?: Date;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  paymentUrl?: string;
  formHtml?: string;
  error?: string;
}

export interface CallbackData {
  [key: string]: string;
}

export interface PaymentResult {
  transactionId: string;
  orderId: string;
  amount: number; // Amount in cents
  status: PaymentStatus;
  paidAt?: Date;
  gatewayTransactionId: string;
  paymentMethod: string;
}

export interface RefundRequest {
  transactionId: string;
  amount: number; // Amount in cents
  reason: string;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  error?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface PaymentConfig {
  newebpay?: NewebPayConfig;
  ecpay?: ECPayConfig;
}

export interface NewebPayConfig {
  merchantId: string;
  hashKey: string;
  hashIV: string;
  apiUrl: string;
  version: string;
}

export interface ECPayConfig {
  merchantId: string;
  hashKey: string;
  hashIV: string;
  apiUrl: string;
}

// ============================================================================
// Gateway-Specific Types
// ============================================================================

// NewebPay specific types
export interface NewebPayTradeInfo {
  MerchantID: string;
  RespondType: string;
  TimeStamp: string;
  Version: string;
  MerchantOrderNo: string;
  Amt: number;
  ItemDesc: string;
  Email: string;
  ReturnURL: string;
  NotifyURL: string;
  CREDIT?: number;
  VACC?: number;
  CVS?: number;
}

export interface NewebPayFormData {
  MerchantID: string;
  TradeInfo: string;
  TradeSha: string;
  Version: string;
}

// ECPay specific types
export interface ECPayPaymentData {
  MerchantID: string;
  MerchantTradeNo: string;
  MerchantTradeDate: string;
  PaymentType: string;
  TotalAmount: string;
  TradeDesc: string;
  ItemName: string;
  ReturnURL: string;
  ClientBackURL: string;
  ChoosePayment: string;
  EncryptType: number;
}

export interface ECPayFormData extends ECPayPaymentData {
  CheckMacValue: string;
}

// ============================================================================
// Service Types
// ============================================================================

export interface CreatePaymentParams {
  orderId: string;
  gateway: PaymentGatewayType;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface HandleCallbackParams {
  gateway: PaymentGatewayType;
  data: CallbackData;
}

export interface QueryPaymentParams {
  orderId: string;
}

export interface RefundPaymentParams {
  orderId: string;
  amount: number;
  reason: string;
}
