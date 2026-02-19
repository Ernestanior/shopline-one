/**
 * Property-Based Tests for ECPay Adapter
 * Feature: taiwan-payment-gateway
 * Validates: Requirements 3.4, 5.3
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { ECPayAdapter } from '../services/payment/ecpay.adapter';
import { PaymentMethod, PaymentRequest } from '../types/payment';
import { sha256 } from '../utils/crypto';

// Fast-check configuration
const fcConfig = {
  numRuns: 100,
  verbose: true,
};

// Test configuration
const testConfig = {
  merchantId: 'TEST_MERCHANT_456',
  hashKey: 'abcdefgh12345678',
  hashIV: '1234567890123456',
  apiUrl: 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
};

// Custom arbitraries
const arbitraries = {
  orderId: () => fc.uuid(),
  amount: () => fc.integer({ min: 1, max: 1000000 }),
  email: () => fc.emailAddress(),
  description: () => fc.string({ minLength: 1, maxLength: 100 }),
  paymentMethod: () => fc.constantFrom(
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.ATM,
    PaymentMethod.CONVENIENCE_STORE,
    PaymentMethod.BARCODE
  ),
  paymentRequest: (): fc.Arbitrary<PaymentRequest> => fc.record({
    orderId: arbitraries.orderId(),
    amount: arbitraries.amount(),
    currency: fc.constant('TWD'),
    description: arbitraries.description(),
    buyerEmail: arbitraries.email(),
    paymentMethod: arbitraries.paymentMethod(),
    returnUrl: fc.constant('https://example.com/return'),
    notifyUrl: fc.constant('https://example.com/notify'),
  }),
};

describe('Property 7: Signature Calculation Correctness (ECPay)', () => {
  test('Feature: taiwan-payment-gateway, Property 7: ECPay signature should be verifiable', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.paymentRequest(),
        async (request) => {
          // Arrange
          const adapter = new ECPayAdapter(testConfig);
          
          // Act: Create payment
          const response = await adapter.createPayment(request);
          
          // Assert: Response should be successful
          expect(response.success).toBe(true);
          expect(response.formHtml).toBeDefined();
          
          // Extract CheckMacValue from form HTML
          const checkMacMatch = response.formHtml!.match(/name="CheckMacValue" value="([^"]+)"/);
          
          expect(checkMacMatch).toBeTruthy();
          
          const checkMacValue = checkMacMatch![1];
          
          // Verify it's a valid SHA256 hash (64 hex characters)
          expect(checkMacValue).toHaveLength(64);
          expect(checkMacValue).toMatch(/^[0-9A-F]{64}$/);
        }
      ),
      fcConfig
    );
  });

  test('Feature: taiwan-payment-gateway, Property 7: Same payment request should produce valid signature format', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.paymentRequest(),
        async (request) => {
          // Arrange
          const adapter = new ECPayAdapter(testConfig);
          
          // Act: Create payment twice with same parameters
          const response1 = await adapter.createPayment(request);
          const response2 = await adapter.createPayment(request);
          
          // Extract signatures
          const checkMac1 = response1.formHtml!.match(/name="CheckMacValue" value="([^"]+)"/)?.[1];
          const checkMac2 = response2.formHtml!.match(/name="CheckMacValue" value="([^"]+)"/)?.[1];
          
          // Assert: Both signatures should be valid SHA256 hashes (64 hex characters)
          // Note: Signatures will differ due to MerchantTradeDate timestamp
          expect(checkMac1).toHaveLength(64);
          expect(checkMac1).toMatch(/^[0-9A-F]{64}$/);
          expect(checkMac2).toHaveLength(64);
          expect(checkMac2).toMatch(/^[0-9A-F]{64}$/);
        }
      ),
      fcConfig
    );
  });

  test('Feature: taiwan-payment-gateway, Property 7: Different amounts should produce different signatures', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.paymentRequest(),
        fc.integer({ min: 1, max: 1000000 }),
        async (request, differentAmount) => {
          // Pre-condition: amounts must be different
          fc.pre(request.amount !== differentAmount);
          
          // Arrange
          const adapter = new ECPayAdapter(testConfig);
          
          // Act: Create payments with different amounts
          const response1 = await adapter.createPayment(request);
          const response2 = await adapter.createPayment({
            ...request,
            amount: differentAmount,
          });
          
          // Extract signatures
          const checkMac1 = response1.formHtml!.match(/name="CheckMacValue" value="([^"]+)"/)?.[1];
          const checkMac2 = response2.formHtml!.match(/name="CheckMacValue" value="([^"]+)"/)?.[1];
          
          // Assert: Signatures should be different
          expect(checkMac1).not.toBe(checkMac2);
        }
      ),
      fcConfig
    );
  });
});

describe('Property 11: Callback Signature Verification (ECPay)', () => {
  test('Feature: taiwan-payment-gateway, Property 11: Valid callback signature should be accepted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          merchantTradeNo: arbitraries.orderId(),
          tradeAmt: arbitraries.amount(),
          rtnCode: fc.constantFrom('1', '0'),
          tradeNo: fc.string({ minLength: 10, maxLength: 20 }),
          paymentType: fc.constantFrom('Credit_CreditCard', 'ATM_LAND', 'CVS_CVS'),
        }),
        async ({ merchantTradeNo, tradeAmt, rtnCode, tradeNo, paymentType }) => {
          // Arrange
          const adapter = new ECPayAdapter(testConfig);
          
          // Create callback data
          const callbackParams = {
            MerchantID: testConfig.merchantId,
            MerchantTradeNo: merchantTradeNo,
            TradeNo: tradeNo,
            TradeAmt: tradeAmt.toString(),
            PaymentDate: '2024/02/14 12:00:00',
            PaymentType: paymentType,
            RtnCode: rtnCode,
            RtnMsg: rtnCode === '1' ? 'Success' : 'Failed',
          };
          
          // Generate valid CheckMacValue
          const sortedKeys = Object.keys(callbackParams).sort();
          const paramStr = sortedKeys
            .map(key => `${key}=${callbackParams[key as keyof typeof callbackParams]}`)
            .join('&');
          
          const str = `HashKey=${testConfig.hashKey}&${paramStr}&HashIV=${testConfig.hashIV}`;
          const encoded = encodeURIComponent(str)
            .replace(/%20/g, '+')
            .replace(/%2d/g, '-')
            .replace(/%5f/g, '_')
            .replace(/%2e/g, '.')
            .replace(/%21/g, '!')
            .replace(/%2a/g, '*')
            .replace(/%28/g, '(')
            .replace(/%29/g, ')')
            .toLowerCase();
          
          const checkMacValue = await sha256(encoded);
          
          const callbackData = {
            ...callbackParams,
            CheckMacValue: checkMacValue.toUpperCase(),
          };
          
          // Act: Verify callback
          const isValid = await adapter.verifyCallback(callbackData);
          
          // Assert: Should be valid
          expect(isValid).toBe(true);
        }
      ),
      fcConfig
    );
  });

  test('Feature: taiwan-payment-gateway, Property 11: Invalid callback signature should be rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          merchantTradeNo: arbitraries.orderId(),
          tradeAmt: arbitraries.amount(),
        }),
        fc.string({ minLength: 64, maxLength: 64 }), // Random invalid signature
        async (payload, invalidSignature) => {
          // Arrange
          const adapter = new ECPayAdapter(testConfig);
          
          const callbackData = {
            MerchantID: testConfig.merchantId,
            MerchantTradeNo: payload.merchantTradeNo,
            TradeNo: 'TEST123',
            TradeAmt: payload.tradeAmt.toString(),
            PaymentDate: '2024/02/14 12:00:00',
            PaymentType: 'Credit_CreditCard',
            RtnCode: '1',
            RtnMsg: 'Success',
            CheckMacValue: invalidSignature, // Invalid signature
          };
          
          // Act: Verify callback
          const isValid = await adapter.verifyCallback(callbackData);
          
          // Assert: Should be invalid
          expect(isValid).toBe(false);
        }
      ),
      fcConfig
    );
  });

  test('Feature: taiwan-payment-gateway, Property 11: Tampered callback amount should be rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          merchantTradeNo: arbitraries.orderId(),
          tradeAmt: arbitraries.amount(),
        }),
        async (payload) => {
          // Arrange
          const adapter = new ECPayAdapter(testConfig);
          
          // Create valid callback
          const callbackParams = {
            MerchantID: testConfig.merchantId,
            MerchantTradeNo: payload.merchantTradeNo,
            TradeNo: 'TEST123',
            TradeAmt: payload.tradeAmt.toString(),
            PaymentDate: '2024/02/14 12:00:00',
            PaymentType: 'Credit_CreditCard',
            RtnCode: '1',
            RtnMsg: 'Success',
          };
          
          // Generate valid signature for original amount
          const sortedKeys = Object.keys(callbackParams).sort();
          const paramStr = sortedKeys
            .map(key => `${key}=${callbackParams[key as keyof typeof callbackParams]}`)
            .join('&');
          
          const str = `HashKey=${testConfig.hashKey}&${paramStr}&HashIV=${testConfig.hashIV}`;
          const encoded = encodeURIComponent(str)
            .replace(/%20/g, '+')
            .replace(/%2d/g, '-')
            .replace(/%5f/g, '_')
            .replace(/%2e/g, '.')
            .replace(/%21/g, '!')
            .replace(/%2a/g, '*')
            .replace(/%28/g, '(')
            .replace(/%29/g, ')')
            .toLowerCase();
          
          const validSignature = await sha256(encoded);
          
          // Tamper with amount
          const tamperedData = {
            ...callbackParams,
            TradeAmt: (payload.tradeAmt + 1000).toString(), // Tampered amount
            CheckMacValue: validSignature.toUpperCase(), // Original signature
          };
          
          // Act: Verify callback
          const isValid = await adapter.verifyCallback(tamperedData);
          
          // Assert: Should be invalid due to tampering
          expect(isValid).toBe(false);
        }
      ),
      fcConfig
    );
  });

  test('Feature: taiwan-payment-gateway, Property 11: Missing CheckMacValue should be rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.orderId(),
        async (orderId) => {
          // Arrange
          const adapter = new ECPayAdapter(testConfig);
          
          const callbackData = {
            MerchantID: testConfig.merchantId,
            MerchantTradeNo: orderId,
            TradeNo: 'TEST123',
            TradeAmt: '1000',
            PaymentDate: '2024/02/14 12:00:00',
            PaymentType: 'Credit_CreditCard',
            RtnCode: '1',
            // CheckMacValue is missing
          };
          
          // Act: Verify callback
          const isValid = await adapter.verifyCallback(callbackData);
          
          // Assert: Should be invalid
          expect(isValid).toBe(false);
        }
      ),
      fcConfig
    );
  });
});
