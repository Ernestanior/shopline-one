/**
 * Property-Based Tests for NewebPay Adapter
 * Feature: taiwan-payment-gateway
 * Validates: Requirements 3.3, 5.2
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { NewebPayAdapter } from '../services/payment/newebpay.adapter';
import { PaymentMethod, PaymentRequest } from '../types/payment';
import { sha256, aesEncrypt } from '../utils/crypto';

// Fast-check configuration
const fcConfig = {
  numRuns: 100,
  verbose: true,
};

// Test configuration
const testConfig = {
  merchantId: 'TEST_MERCHANT_123',
  hashKey: '1234567890123456',
  hashIV: '1234567890123456',
  apiUrl: 'https://test.newebpay.com/MPG/mpg_gateway',
  version: '2.0',
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
    PaymentMethod.CONVENIENCE_STORE
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

describe('Property 7: Signature Calculation Correctness (NewebPay)', () => {
  test('Feature: taiwan-payment-gateway, Property 7: NewebPay signature should be verifiable', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.paymentRequest(),
        async (request) => {
          // Arrange
          const adapter = new NewebPayAdapter(testConfig);
          
          // Act: Create payment
          const response = await adapter.createPayment(request);
          
          // Assert: Response should be successful
          expect(response.success).toBe(true);
          expect(response.formHtml).toBeDefined();
          
          // Extract TradeInfo and TradeSha from form HTML
          const tradeInfoMatch = response.formHtml!.match(/name="TradeInfo" value="([^"]+)"/);
          const tradeShaMatch = response.formHtml!.match(/name="TradeSha" value="([^"]+)"/);
          
          expect(tradeInfoMatch).toBeTruthy();
          expect(tradeShaMatch).toBeTruthy();
          
          const tradeInfo = tradeInfoMatch![1];
          const tradeSha = tradeShaMatch![1];
          
          // Verify signature manually
          const expectedSha = await sha256(
            `HashKey=${testConfig.hashKey}&${tradeInfo}&HashIV=${testConfig.hashIV}`
          );
          
          expect(tradeSha.toUpperCase()).toBe(expectedSha.toUpperCase());
        }
      ),
      fcConfig
    );
  });

  test('Feature: taiwan-payment-gateway, Property 7: Same payment request should produce same signature', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.paymentRequest(),
        async (request) => {
          // Arrange
          const adapter = new NewebPayAdapter(testConfig);
          
          // Act: Create payment twice with same parameters
          const response1 = await adapter.createPayment(request);
          const response2 = await adapter.createPayment(request);
          
          // Extract signatures
          const tradeSha1 = response1.formHtml!.match(/name="TradeSha" value="([^"]+)"/)?.[1];
          const tradeSha2 = response2.formHtml!.match(/name="TradeSha" value="([^"]+)"/)?.[1];
          
          // Assert: Signatures should be identical (deterministic)
          expect(tradeSha1).toBe(tradeSha2);
        }
      ),
      fcConfig
    );
  });
});

describe('Property 11: Callback Signature Verification (NewebPay)', () => {
  test('Feature: taiwan-payment-gateway, Property 11: Valid callback signature should be accepted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          orderId: arbitraries.orderId(),
          amount: arbitraries.amount(),
          status: fc.constantFrom('SUCCESS', 'FAILED'),
          tradeNo: fc.string({ minLength: 10, maxLength: 20 }),
        }),
        async ({ orderId, amount, status, tradeNo }) => {
          // Arrange
          const adapter = new NewebPayAdapter(testConfig);
          
          // Create mock callback data
          const callbackPayload = {
            Status: status,
            Result: {
              MerchantOrderNo: orderId,
              Amt: amount.toString(),
              TradeNo: tradeNo,
              PaymentType: 'CREDIT',
              PayTime: new Date().toISOString(),
            },
          };
          
          // Encrypt the payload
          const tradeInfo = await aesEncrypt(
            JSON.stringify(callbackPayload),
            testConfig.hashKey,
            testConfig.hashIV
          );
          
          // Generate valid signature
          const tradeSha = await sha256(
            `HashKey=${testConfig.hashKey}&${tradeInfo}&HashIV=${testConfig.hashIV}`
          );
          
          const callbackData = {
            TradeInfo: tradeInfo,
            TradeSha: tradeSha.toUpperCase(),
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
          orderId: arbitraries.orderId(),
          amount: arbitraries.amount(),
        }),
        fc.string({ minLength: 64, maxLength: 64 }), // Random invalid signature
        async (payload, invalidSignature) => {
          // Arrange
          const adapter = new NewebPayAdapter(testConfig);
          
          const callbackPayload = {
            Status: 'SUCCESS',
            Result: {
              MerchantOrderNo: payload.orderId,
              Amt: payload.amount.toString(),
              TradeNo: 'TEST123',
              PaymentType: 'CREDIT',
            },
          };
          
          const tradeInfo = await aesEncrypt(
            JSON.stringify(callbackPayload),
            testConfig.hashKey,
            testConfig.hashIV
          );
          
          const callbackData = {
            TradeInfo: tradeInfo,
            TradeSha: invalidSignature, // Invalid signature
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

  test('Feature: taiwan-payment-gateway, Property 11: Tampered callback data should be rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          orderId: arbitraries.orderId(),
          amount: arbitraries.amount(),
        }),
        async (payload) => {
          // Arrange
          const adapter = new NewebPayAdapter(testConfig);
          
          const callbackPayload = {
            Status: 'SUCCESS',
            Result: {
              MerchantOrderNo: payload.orderId,
              Amt: payload.amount.toString(),
              TradeNo: 'TEST123',
              PaymentType: 'CREDIT',
            },
          };
          
          // Encrypt original payload
          const tradeInfo = await aesEncrypt(
            JSON.stringify(callbackPayload),
            testConfig.hashKey,
            testConfig.hashIV
          );
          
          // Generate valid signature for original
          const validSignature = await sha256(
            `HashKey=${testConfig.hashKey}&${tradeInfo}&HashIV=${testConfig.hashIV}`
          );
          
          // Tamper with the encrypted data (change one character)
          const tamperedTradeInfo = tradeInfo.substring(0, tradeInfo.length - 1) + 'X';
          
          const callbackData = {
            TradeInfo: tamperedTradeInfo,
            TradeSha: validSignature.toUpperCase(),
          };
          
          // Act: Verify callback
          const isValid = await adapter.verifyCallback(callbackData);
          
          // Assert: Should be invalid due to tampering
          expect(isValid).toBe(false);
        }
      ),
      fcConfig
    );
  });

  test('Feature: taiwan-payment-gateway, Property 11: Missing signature should be rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.orderId(),
        async (orderId) => {
          // Arrange
          const adapter = new NewebPayAdapter(testConfig);
          
          const callbackData = {
            TradeInfo: 'some_encrypted_data',
            // TradeSha is missing
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
