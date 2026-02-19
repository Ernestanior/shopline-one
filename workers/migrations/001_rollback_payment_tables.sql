-- Rollback Migration: Remove Payment Gateway Tables
-- Date: 2026-02-13
-- Description: Rollback payment gateway tables

-- Drop indexes first
DROP INDEX IF EXISTS idx_payment_security_logs_gateway;
DROP INDEX IF EXISTS idx_payment_security_logs_created_at;
DROP INDEX IF EXISTS idx_payment_security_logs_event_type;

DROP INDEX IF EXISTS idx_payment_refunds_created_at;
DROP INDEX IF EXISTS idx_payment_refunds_status;
DROP INDEX IF EXISTS idx_payment_refunds_transaction_id;

DROP INDEX IF EXISTS idx_payment_callbacks_created_at;
DROP INDEX IF EXISTS idx_payment_callbacks_transaction_id;

DROP INDEX IF EXISTS idx_payment_transactions_gateway;
DROP INDEX IF EXISTS idx_payment_transactions_created_at;
DROP INDEX IF EXISTS idx_payment_transactions_status;
DROP INDEX IF EXISTS idx_payment_transactions_order_id;

-- Drop tables
DROP TABLE IF EXISTS payment_security_logs;
DROP TABLE IF EXISTS payment_refunds;
DROP TABLE IF EXISTS payment_callbacks;
DROP TABLE IF EXISTS payment_transactions;
