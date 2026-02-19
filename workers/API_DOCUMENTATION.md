# Taiwan Payment Gateway API Documentation

## Overview

This API provides integration with Taiwan payment gateways (NewebPay and ECPay) for e-commerce transactions. The API supports payment creation, callback handling, status queries, and refunds.

**Base URL**: `https://your-domain.com/api`

**Authentication**: Bearer token (JWT) required for most endpoints

## Endpoints

### 1. Create Payment

Creates a new payment transaction and returns an HTML form for redirecting to the payment gateway.

**Endpoint**: `POST /api/payment/create`

**Authentication**: Required (User)

**Request Body**:
```json
{
  "orderId": "string",
  "gateway": "newebpay" | "ecpay",
  "paymentMethod": "credit_card" | "atm" | "cvs" | "barcode"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "transactionId": "string",
  "formHtml": "<form>...</form>"
}
```

**Response** (400 Bad Request):
```json
{
  "error": "ERROR_CODE",
  "message": "Error description"
}
```

**Example**:
```bash
curl -X POST https://your-domain.com/api/payment/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-12345",
    "gateway": "newebpay",
    "paymentMethod": "credit_card"
  }'
```

---

### 2. Payment Callback

Receives payment notifications from the payment gateway. This endpoint is called by the gateway, not by clients.

**Endpoint**: `POST /api/payment/callback/:gateway`

**Authentication**: None (verified by signature)

**Parameters**:
- `gateway`: `newebpay` or `ecpay`

**Request Body**: Form data (varies by gateway)

**Response** (200 OK):
```
1|OK
```

**Response** (400 Bad Request):
```
0|Error message
```

---

### 3. Query Payment Status

Retrieves the current status of a payment transaction.

**Endpoint**: `GET /api/payment/status/:orderId`

**Authentication**: Required (User - must own the order)

**Parameters**:
- `orderId`: Order identifier

**Response** (200 OK):
```json
{
  "transactionId": "string",
  "orderId": "string",
  "amount": 10000,
  "status": "pending" | "processing" | "success" | "failed" | "expired" | "refunded" | "cancelled",
  "paidAt": "2024-01-01T00:00:00Z",
  "gatewayTransactionId": "string",
  "paymentMethod": "credit_card"
}
```

**Response** (404 Not Found):
```json
{
  "error": "ORDER_NOT_FOUND",
  "message": "Order not found"
}
```

**Example**:
```bash
curl https://your-domain.com/api/payment/status/ORD-12345 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Refund Payment

Initiates a refund for a successful payment transaction.

**Endpoint**: `POST /api/payment/refund`

**Authentication**: Required (Admin)

**Request Body**:
```json
{
  "orderId": "string",
  "amount": 10000,
  "reason": "string"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "refundId": "string"
}
```

**Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Error description"
}
```

**Example**:
```bash
curl -X POST https://your-domain.com/api/payment/refund \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-12345",
    "amount": 10000,
    "reason": "Customer request"
  }'
```

---

## Data Types

### Payment Status

- `pending`: Payment initiated, waiting for user action
- `processing`: Payment in progress at gateway
- `success`: Payment completed successfully
- `failed`: Payment failed
- `expired`: Payment expired (not completed within time limit)
- `refunded`: Payment refunded
- `cancelled`: Payment cancelled

### Payment Method

- `credit_card`: Credit/debit card payment
- `atm`: ATM transfer (virtual account)
- `cvs`: Convenience store payment code
- `barcode`: Convenience store barcode (ECPay only)

### Gateway

- `newebpay`: NewebPay (蓝新金流)
- `ecpay`: ECPay (绿界科技)

---

## Error Codes

### Configuration Errors
- `INVALID_CREDENTIALS`: Invalid API credentials
- `GATEWAY_NOT_FOUND`: Payment gateway not configured

### Validation Errors
- `INVALID_AMOUNT`: Invalid payment amount
- `ORDER_NOT_FOUND`: Order not found
- `INVALID_PAYMENT_METHOD`: Invalid payment method for gateway

### Gateway Errors
- `GATEWAY_TIMEOUT`: Gateway request timed out
- `GATEWAY_ERROR`: Gateway returned an error
- `INVALID_SIGNATURE`: Callback signature verification failed

### Business Logic Errors
- `ORDER_ALREADY_PAID`: Order already paid
- `DUPLICATE_PAYMENT`: Duplicate payment attempt
- `REFUND_AMOUNT_EXCEEDED`: Refund amount exceeds payment amount

### Security Errors
- `UNAUTHORIZED`: Authentication required or failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `CSRF_VALIDATION_FAILED`: CSRF token validation failed

---

## Payment Flow

### Standard Payment Flow

1. **User initiates checkout**
   - Frontend calls `POST /api/payment/create`
   - Backend creates transaction record
   - Backend returns HTML form

2. **Redirect to gateway**
   - Frontend auto-submits the form
   - User is redirected to payment gateway
   - User completes payment at gateway

3. **Gateway callback**
   - Gateway sends callback to `POST /api/payment/callback/:gateway`
   - Backend verifies signature
   - Backend updates transaction and order status

4. **User returns**
   - User is redirected back to frontend
   - Frontend calls `GET /api/payment/status/:orderId`
   - Frontend displays payment result

### Refund Flow

1. **Admin initiates refund**
   - Admin calls `POST /api/payment/refund`
   - Backend validates original payment
   - Backend calls gateway refund API

2. **Refund processing**
   - Gateway processes refund
   - Backend creates refund record
   - Backend updates transaction status

---

## Security

### Authentication

All endpoints except callback require JWT authentication via Bearer token:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Callback Verification

Payment gateway callbacks are verified using cryptographic signatures:
- **NewebPay**: SHA256 hash with HashKey and HashIV
- **ECPay**: SHA256 CheckMacValue with HashKey and HashIV

### Rate Limiting

Payment endpoints are rate-limited to 10 requests per minute per user.

### CSRF Protection

Payment creation endpoints require valid CSRF tokens.

---

## Testing

### Test Environment

Use test credentials and endpoints for development:

**NewebPay Test**:
- Merchant ID: Test merchant ID from NewebPay
- API URL: `https://ccore.newebpay.com/MPG/mpg_gateway`

**ECPay Test**:
- Merchant ID: Test merchant ID from ECPay
- API URL: `https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5`

### Test Cards

Refer to gateway documentation for test card numbers and scenarios.

---

## Support

For issues or questions:
- Check error codes and messages
- Review transaction logs in admin panel
- Contact technical support with transaction ID

---

## Changelog

### Version 1.0.0 (2024-01-01)
- Initial release
- Support for NewebPay and ECPay
- Payment creation, callback handling, status query, and refunds
- Property-based testing with 52 correctness properties
