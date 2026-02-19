# Payment Gateway Schema and Types Setup

## Overview
This document describes the database schema and TypeScript type definitions created for the Taiwan payment gateway integration (NewebPay and ECPay).

## Files Created

### 1. Database Migration Files

#### `migrations/001_add_payment_tables.sql`
Main migration file that creates four payment-related tables:
- `payment_transactions` - Stores all payment transaction records
- `payment_callbacks` - Logs all callback attempts from payment gateways
- `payment_refunds` - Tracks refund operations
- `payment_security_logs` - Records security events (invalid signatures, rate limits, etc.)

#### `migrations/001_rollback_payment_tables.sql`
Rollback script to remove all payment tables and indexes.

#### `migrations/README.md`
Documentation for applying and rolling back migrations.

#### `apply-payment-migration.sh`
Helper script to apply migrations to D1 database.

### 2. TypeScript Type Definitions

#### `src/types/payment.ts`
Comprehensive type definitions for the payment system including:

**Enums:**
- `PaymentStatus` - Transaction status values
- `PaymentMethod` - Supported payment methods
- `PaymentGatewayType` - Gateway identifiers
- `RefundStatus` - Refund status values

**Database Models:**
- `PaymentTransaction` - Transaction record structure
- `PaymentCallback` - Callback log structure
- `PaymentRefund` - Refund record structure
- `PaymentSecurityLog` - Security log structure

**Gateway Interface:**
- `PaymentGateway` - Interface that all gateway adapters must implement

**Request/Response Types:**
- `PaymentRequest` - Payment creation parameters
- `PaymentResponse` - Payment creation result
- `CallbackData` - Gateway callback data
- `PaymentResult` - Parsed payment result
- `RefundRequest` - Refund parameters
- `RefundResponse` - Refund result

**Configuration Types:**
- `PaymentConfig` - Overall payment configuration
- `NewebPayConfig` - NewebPay-specific configuration
- `ECPayConfig` - ECPay-specific configuration

**Gateway-Specific Types:**
- NewebPay trade info and form data structures
- ECPay payment data and form data structures

### 3. Updated Existing Files

#### `schema.sql`
Added payment tables to the main schema file (tables 11-14).

#### `src/types/models.ts`
Added payment model interfaces to match database tables.

#### `src/types/env.ts`
Added environment variable definitions for:
- NewebPay credentials (NEWEBPAY_MERCHANT_ID, NEWEBPAY_HASH_KEY, NEWEBPAY_HASH_IV, NEWEBPAY_API_URL)
- ECPay credentials (ECPAY_MERCHANT_ID, ECPAY_HASH_KEY, ECPAY_HASH_IV, ECPAY_API_URL)
- Frontend and API URLs (FRONTEND_URL, API_URL)

## Database Schema Details

### payment_transactions
Stores all payment transaction records with the following key fields:
- `id` (TEXT PRIMARY KEY) - Unique transaction identifier
- `order_id` (TEXT) - Reference to the order
- `gateway` (TEXT) - Gateway identifier ('newebpay' or 'ecpay')
- `amount` (INTEGER) - Amount in cents (smallest currency unit)
- `status` (TEXT) - Transaction status
- `payment_method` (TEXT) - Payment method used
- Timestamps: `created_at`, `updated_at`, `paid_at`, `expired_at`

### payment_callbacks
Logs all callback attempts from payment gateways:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `transaction_id` (TEXT) - Reference to transaction
- `gateway` (TEXT) - Gateway identifier
- `callback_data` (TEXT) - JSON-formatted callback data
- `status` (TEXT) - Processing status ('success' or 'failed')
- `error_message` (TEXT) - Error details if failed

### payment_refunds
Tracks refund operations:
- `id` (TEXT PRIMARY KEY) - Unique refund identifier
- `transaction_id` (TEXT) - Reference to original transaction
- `amount` (INTEGER) - Refund amount in cents
- `reason` (TEXT) - Refund reason
- `status` (TEXT) - Refund status
- `gateway_refund_id` (TEXT) - Gateway's refund identifier

### payment_security_logs
Records security events:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `event_type` (TEXT) - Type of security event
- `gateway` (TEXT) - Gateway involved
- `ip_address` (TEXT) - Source IP address
- `request_data` (TEXT) - JSON-formatted request data

## Applying the Migration

### Local Development
```bash
# Apply to local D1 database
npx wrangler d1 execute ecommerce-db --local --file=./migrations/001_add_payment_tables.sql

# Or use the helper script
chmod +x apply-payment-migration.sh
./apply-payment-migration.sh ecommerce-db
```

### Production
```bash
# Apply to production D1 database
npx wrangler d1 execute ecommerce-db --file=./migrations/001_add_payment_tables.sql
```

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **Requirement 7.1**: Transaction records stored in D1 Database with complete payment details
- **Requirement 7.2**: Transaction creation records timestamp, amount, gateway, payment method, order ID, and unique transaction ID
- **Requirement 12.2**: Amounts stored as integers representing the smallest currency unit (cents)

## Next Steps

1. Apply the migration to your D1 database (local and/or production)
2. Implement the crypto utility functions (Task 2)
3. Implement the PaymentGateway interface and adapters (Task 3)
4. Implement the PaymentService (Task 5)

## Notes

- All amounts are stored in cents (smallest currency unit) to avoid floating-point precision issues
- The schema uses TEXT for primary keys on transactions and refunds to support UUID or custom ID formats
- Foreign key constraints ensure referential integrity
- Comprehensive indexes are created for common query patterns
- The design supports multiple payment attempts per order
- Security logging is built-in for audit trails
