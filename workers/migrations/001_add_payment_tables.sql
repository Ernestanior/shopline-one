-- Migration: Add Payment Gateway Tables
-- Date: 2026-02-13
-- Description: Add tables for Taiwan payment gateway integration (NewebPay and ECPay)

-- 1. Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  gateway TEXT NOT NULL, -- 'newebpay' or 'ecpay'
  gateway_transaction_id TEXT,
  amount INTEGER NOT NULL, -- Amount in cents (smallest currency unit)
  currency TEXT NOT NULL DEFAULT 'TWD',
  payment_method TEXT NOT NULL, -- 'credit_card', 'atm', 'cvs', 'barcode'
  status TEXT NOT NULL, -- 'pending', 'processing', 'success', 'failed', 'expired', 'refunded', 'cancelled'
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT,
  expired_at TEXT
);

CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX idx_payment_transactions_gateway ON payment_transactions(gateway);

-- 2. Payment Callbacks Table
CREATE TABLE IF NOT EXISTS payment_callbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT NOT NULL,
  gateway TEXT NOT NULL,
  callback_data TEXT NOT NULL, -- JSON format
  status TEXT NOT NULL, -- 'success' or 'failed'
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id) ON DELETE CASCADE
);

CREATE INDEX idx_payment_callbacks_transaction_id ON payment_callbacks(transaction_id);
CREATE INDEX idx_payment_callbacks_created_at ON payment_callbacks(created_at);

-- 3. Payment Refunds Table
CREATE TABLE IF NOT EXISTS payment_refunds (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  reason TEXT,
  status TEXT NOT NULL, -- 'pending', 'success', 'failed'
  gateway_refund_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT,
  FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id) ON DELETE CASCADE
);

CREATE INDEX idx_payment_refunds_transaction_id ON payment_refunds(transaction_id);
CREATE INDEX idx_payment_refunds_status ON payment_refunds(status);
CREATE INDEX idx_payment_refunds_created_at ON payment_refunds(created_at);

-- 4. Payment Security Logs Table
CREATE TABLE IF NOT EXISTS payment_security_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL, -- 'invalid_signature', 'rate_limit', 'invalid_ip', etc.
  gateway TEXT,
  ip_address TEXT,
  user_agent TEXT,
  request_data TEXT, -- JSON format
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_payment_security_logs_event_type ON payment_security_logs(event_type);
CREATE INDEX idx_payment_security_logs_created_at ON payment_security_logs(created_at);
CREATE INDEX idx_payment_security_logs_gateway ON payment_security_logs(gateway);
