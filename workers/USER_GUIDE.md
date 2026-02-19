# Taiwan Payment Gateway User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Configuration](#configuration)
3. [Testing Payment Flow](#testing-payment-flow)
4. [Common Issues](#common-issues)
5. [Best Practices](#best-practices)

---

## Introduction

This guide helps you configure and test the Taiwan payment gateway integration for your e-commerce system. The system supports two major payment gateways:

- **NewebPay (蓝新金流)**: Supports credit card, ATM, and convenience store payments
- **ECPay (绿界科技)**: Supports credit card, ATM, convenience store, and barcode payments

---

## Configuration

### Step 1: Obtain Gateway Credentials

#### NewebPay
1. Register at [NewebPay](https://www.newebpay.com/)
2. Complete merchant verification
3. Obtain from merchant dashboard:
   - Merchant ID (商店代號)
   - Hash Key
   - Hash IV
4. Note the API endpoints:
   - Test: `https://ccore.newebpay.com/MPG/mpg_gateway`
   - Production: `https://core.newebpay.com/MPG/mpg_gateway`

#### ECPay
1. Register at [ECPay](https://www.ecpay.com.tw/)
2. Complete merchant verification
3. Obtain from merchant dashboard:
   - Merchant ID (特店編號)
   - Hash Key
   - Hash IV
4. Note the API endpoints:
   - Test: `https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5`
   - Production: `https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5`

### Step 2: Configure Environment Variables

Create or update your `.env` file in the `workers` directory:

```bash
# Environment
ENVIRONMENT=test  # or 'production'

# NewebPay Configuration
NEWEBPAY_MERCHANT_ID=your_merchant_id
NEWEBPAY_HASH_KEY=your_hash_key_32_chars
NEWEBPAY_HASH_IV=your_hash_iv_16_chars
NEWEBPAY_API_URL=https://ccore.newebpay.com/MPG/mpg_gateway

# ECPay Configuration
ECPAY_MERCHANT_ID=your_merchant_id
ECPAY_HASH_KEY=your_hash_key
ECPAY_HASH_IV=your_hash_iv
ECPAY_API_URL=https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5

# Frontend URL (for return URL)
FRONTEND_URL=http://localhost:3000

# API URL (for callback URL)
API_URL=http://localhost:8787
```

**Important Notes**:
- NewebPay Hash Key must be exactly 32 characters
- NewebPay Hash IV must be exactly 16 characters
- Always use test credentials in development
- Never commit credentials to version control

### Step 3: Deploy to Cloudflare Workers

#### Configure Secrets

```bash
# Navigate to workers directory
cd workers

# Set environment variables as secrets
wrangler secret put NEWEBPAY_MERCHANT_ID
wrangler secret put NEWEBPAY_HASH_KEY
wrangler secret put NEWEBPAY_HASH_IV
wrangler secret put ECPAY_MERCHANT_ID
wrangler secret put ECPAY_HASH_KEY
wrangler secret put ECPAY_HASH_IV
```

#### Deploy

```bash
# Deploy to development environment
npm run deploy:dev

# Deploy to production environment
npm run deploy
```

### Step 4: Configure Callback URLs

Register your callback URLs with the payment gateways:

**NewebPay**:
- Return URL: `https://your-domain.com/payment/return`
- Notify URL: `https://your-domain.com/api/payment/callback/newebpay`

**ECPay**:
- Return URL: `https://your-domain.com/payment/return`
- Notify URL: `https://your-domain.com/api/payment/callback/ecpay`

---

## Testing Payment Flow

### Test Environment Setup

1. **Start local development server**:
   ```bash
   cd workers
   npm run dev
   ```

2. **Start frontend development server**:
   ```bash
   cd client
   npm start
   ```

### Test Scenarios

#### Scenario 1: Credit Card Payment (NewebPay)

1. Create a test order in your system
2. Navigate to checkout page
3. Select "NewebPay" as payment gateway
4. Select "Credit Card" as payment method
5. Click "Proceed to Payment"
6. You'll be redirected to NewebPay test page
7. Use test card number: `4000-2211-1111-1111`
8. Enter any future expiry date and CVV
9. Complete payment
10. You'll be redirected back to your site
11. Verify payment status shows "Success"

#### Scenario 2: ATM Payment (NewebPay)

1. Create a test order
2. Select "NewebPay" → "ATM Transfer"
3. Complete payment initiation
4. Note the virtual account number
5. In test environment, payment will auto-complete after a few minutes
6. Check payment status via status query endpoint

#### Scenario 3: Convenience Store Payment (ECPay)

1. Create a test order
2. Select "ECPay" → "Convenience Store"
3. Complete payment initiation
4. Note the payment code
5. In test environment, simulate payment completion
6. Verify payment status updates

### Testing Callbacks

To test callback handling locally, you need to expose your local server:

1. **Using ngrok**:
   ```bash
   ngrok http 8787
   ```

2. **Update callback URL** in gateway settings to ngrok URL:
   ```
   https://your-ngrok-url.ngrok.io/api/payment/callback/newebpay
   ```

3. **Test payment flow** and verify callbacks are received

### Testing Refunds

1. Complete a successful payment
2. Login as admin
3. Navigate to transaction management
4. Find the transaction
5. Click "Refund"
6. Enter refund amount and reason
7. Submit refund request
8. Verify refund status in gateway dashboard

---

## Common Issues

### Issue 1: Invalid Signature Error

**Symptoms**: Callback returns "Invalid signature" error

**Causes**:
- Incorrect Hash Key or Hash IV
- Key length mismatch (NewebPay requires 32/16 chars)
- Using production keys in test environment

**Solutions**:
1. Verify credentials in environment variables
2. Check key lengths
3. Ensure test/production environment match

### Issue 2: Payment Form Not Displaying

**Symptoms**: Blank page or error after clicking "Pay"

**Causes**:
- CORS issues
- Invalid API response
- Missing gateway configuration

**Solutions**:
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check gateway configuration in environment variables

### Issue 3: Callback Not Received

**Symptoms**: Payment completes but order status doesn't update

**Causes**:
- Callback URL not accessible from internet
- Firewall blocking gateway IPs
- Callback URL not registered with gateway

**Solutions**:
1. Verify callback URL is publicly accessible
2. Check server logs for callback attempts
3. Verify callback URL in gateway settings
4. Use ngrok for local testing

### Issue 4: Amount Mismatch

**Symptoms**: Payment amount doesn't match order total

**Causes**:
- Currency conversion issues
- Incorrect amount calculation
- Rounding errors

**Solutions**:
1. Verify amounts are stored as integers (cents)
2. Check amount calculation logic
3. Ensure proper formatting when displaying

### Issue 5: Expired Payment

**Symptoms**: Payment shows as expired before user completes

**Causes**:
- Expiration time too short
- User took too long to complete payment
- System clock mismatch

**Solutions**:
1. Check expiration time settings (30 min for credit card, 3 days for ATM/CVS)
2. Verify system time is correct
3. Allow user to retry payment

---

## Best Practices

### Security

1. **Never expose credentials**:
   - Use environment variables
   - Never commit to version control
   - Rotate keys regularly

2. **Validate all callbacks**:
   - Always verify signatures
   - Check transaction status before updating orders
   - Log security events

3. **Use HTTPS**:
   - Always use HTTPS in production
   - Ensure SSL certificates are valid

### Performance

1. **Implement caching**:
   - Cache gateway configuration
   - Cache transaction status for short periods

2. **Use async processing**:
   - Process callbacks asynchronously
   - Don't block on external API calls

3. **Monitor timeouts**:
   - Set appropriate timeouts (30 seconds)
   - Implement retry logic for transient failures

### User Experience

1. **Provide clear feedback**:
   - Show loading states during payment
   - Display clear error messages
   - Provide retry options on failure

2. **Handle edge cases**:
   - Support multiple payment attempts
   - Handle expired payments gracefully
   - Provide status polling for pending payments

3. **Test thoroughly**:
   - Test all payment methods
   - Test error scenarios
   - Test on different devices and browsers

### Monitoring

1. **Log important events**:
   - Payment initiations
   - Callback receipts
   - Refund operations
   - Security events

2. **Set up alerts**:
   - Failed payment rate exceeds threshold
   - Callback signature failures
   - Gateway API errors

3. **Track metrics**:
   - Payment success rate
   - Average payment time
   - Refund rate
   - Gateway response times

### Compliance

1. **Data retention**:
   - Keep transaction logs for 7 years
   - Never store credit card numbers
   - Mask sensitive data in logs

2. **PCI compliance**:
   - Never handle credit card data directly
   - Use gateway-provided payment pages
   - Implement proper security controls

3. **Privacy**:
   - Follow GDPR/local privacy laws
   - Provide data export/deletion capabilities
   - Obtain user consent for data processing

---

## Support Resources

### Documentation
- [NewebPay API Documentation](https://www.newebpay.com/website/Page/content/download_api)
- [ECPay API Documentation](https://www.ecpay.com.tw/Service/API_Dwnld)

### Contact
- NewebPay Support: support@newebpay.com
- ECPay Support: techsupport@ecpay.com.tw

### Internal Resources
- API Documentation: `API_DOCUMENTATION.md`
- Operations Guide: `OPERATIONS_GUIDE.md`
- Deployment Guide: `PAYMENT_DEPLOYMENT_GUIDE.md`

---

## Appendix: Test Data

### NewebPay Test Cards

| Card Number | Result |
|-------------|--------|
| 4000-2211-1111-1111 | Success |
| 4000-2211-1111-1112 | Insufficient funds |
| 4000-2211-1111-1113 | Invalid card |

### ECPay Test Cards

| Card Number | Result |
|-------------|--------|
| 4311-9522-2222-2222 | Success |
| 4311-9522-2222-2223 | Declined |

### Test Amounts

- Amounts ending in 00: Success
- Amounts ending in 01: Insufficient funds
- Amounts ending in 05: Card declined

---

## Troubleshooting Checklist

Before contacting support, verify:

- [ ] Environment variables are set correctly
- [ ] API endpoints are accessible
- [ ] Callback URLs are publicly accessible
- [ ] Hash Key and Hash IV lengths are correct
- [ ] Test/production environment matches credentials
- [ ] CORS is configured properly
- [ ] SSL certificates are valid
- [ ] System time is synchronized
- [ ] Firewall allows gateway IPs
- [ ] Rate limits are not exceeded

---

Last updated: 2024-01-01
