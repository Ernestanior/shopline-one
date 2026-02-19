/**
 * End-to-End Payment Flow Simulation Tests
 * Tests complete payment flows without real gateway credentials
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockNewebPayGateway, MockECPayGateway, generateTestOrder } from './payment-gateway-mock';

describe('Payment E2E Simulation - NewebPay', () => {
  let gateway: MockNewebPayGateway;

  beforeEach(() => {
    gateway = new MockNewebPayGateway();
  });

  it('should complete full payment flow successfully', async () => {
    const order = generateTestOrder();

    // Step 1: Create payment
    const createResult = await gateway.createPayment({
      MerchantOrderNo: order.orderId,
      Amt: order.amount,
      ItemDesc: order.description,
      Email: order.customerEmail,
    });

    expect(createResult.Status).toBe('SUCCESS');
    expect(createResult.Result.MerchantOrderNo).toBe(order.orderId);
    expect(createResult.Result.PaymentURL).toContain(order.orderId);

    // Step 2: Simulate customer payment (callback)
    const callbackData = gateway.simulateCallback(order.orderId, true);
    const callback = JSON.parse(callbackData);

    expect(callback.Status).toBe('SUCCESS');
    expect(callback.MerchantOrderNo).toBe(order.orderId);

    // Step 3: Query payment status
    const queryResult = await gateway.queryPayment(callback.TradeNo);

    expect(queryResult.Status).toBe('SUCCESS');
    expect(queryResult.Result.TradeStatus).toBe('1');
  });

  it('should handle payment failure', async () => {
    const order = generateTestOrder();

    // Create payment
    const createResult = await gateway.createPayment({
      MerchantOrderNo: order.orderId,
      Amt: order.amount,
    });

    // Simulate failed payment
    const callbackData = gateway.simulateCallback(order.orderId, false);
    const callback = JSON.parse(callbackData);

    expect(callback.Status).toBe('FAILED');
  });

  it('should process refund successfully', async () => {
    const order = generateTestOrder();

    // Create and complete payment first
    const createResult = await gateway.createPayment({
      MerchantOrderNo: order.orderId,
      Amt: order.amount,
    });

    const callbackData = gateway.simulateCallback(order.orderId, true);
    const callback = JSON.parse(callbackData);

    // Process refund
    const refundResult = await gateway.refundPayment({
      TradeNo: callback.TradeNo,
      Amt: order.amount,
    });

    expect(refundResult.Status).toBe('SUCCESS');
    expect(refundResult.Result.RefundAmt).toBe(order.amount);
  });

  it('should handle network errors gracefully', async () => {
    const failingGateway = new MockNewebPayGateway({
      shouldSucceed: false,
      customError: 'Network timeout',
    });

    const order = generateTestOrder();

    await expect(
      failingGateway.createPayment({
        MerchantOrderNo: order.orderId,
        Amt: order.amount,
      })
    ).rejects.toThrow('Network timeout');
  });

  it('should handle concurrent payments', async () => {
    const orders = Array.from({ length: 5 }, (_, i) =>
      generateTestOrder({ orderId: `TEST_ORDER_${Date.now()}_${i}` })
    );

    const results = await Promise.all(
      orders.map(order =>
        gateway.createPayment({
          MerchantOrderNo: order.orderId,
          Amt: order.amount,
        })
      )
    );

    expect(results).toHaveLength(5);
    results.forEach((result, i) => {
      expect(result.Status).toBe('SUCCESS');
      expect(result.Result.MerchantOrderNo).toBe(orders[i].orderId);
    });
  });
});

describe('Payment E2E Simulation - ECPay', () => {
  let gateway: MockECPayGateway;

  beforeEach(() => {
    gateway = new MockECPayGateway();
  });

  it('should complete full payment flow successfully', async () => {
    const order = generateTestOrder();

    // Step 1: Create payment
    const createResult = await gateway.createPayment({
      MerchantTradeNo: order.orderId,
      TotalAmount: order.amount,
      TradeDesc: order.description,
    });

    expect(createResult.RtnCode).toBe('1');
    expect(createResult.MerchantTradeNo).toBe(order.orderId);
    expect(createResult.PaymentURL).toContain(order.orderId);

    // Step 2: Simulate customer payment (callback)
    const callbackData = gateway.simulateCallback(order.orderId, true);
    const callback = new URLSearchParams(callbackData);

    expect(callback.get('RtnCode')).toBe('1');
    expect(callback.get('MerchantTradeNo')).toBe(order.orderId);

    // Step 3: Query payment status
    const queryResult = await gateway.queryPayment(callback.get('TradeNo')!);

    expect(queryResult.RtnCode).toBe(1);
    expect(queryResult.TradeStatus).toBe('1');
  });

  it('should handle payment failure', async () => {
    const order = generateTestOrder();

    const createResult = await gateway.createPayment({
      MerchantTradeNo: order.orderId,
      TotalAmount: order.amount,
    });

    const callbackData = gateway.simulateCallback(order.orderId, false);
    const callback = new URLSearchParams(callbackData);

    expect(callback.get('RtnCode')).toBe('0');
    expect(callback.get('RtnMsg')).toBe('交易失敗');
  });

  it('should process refund successfully', async () => {
    const order = generateTestOrder();

    const createResult = await gateway.createPayment({
      MerchantTradeNo: order.orderId,
      TotalAmount: order.amount,
    });

    const callbackData = gateway.simulateCallback(order.orderId, true);
    const callback = new URLSearchParams(callbackData);

    const refundResult = await gateway.refundPayment({
      TradeNo: callback.get('TradeNo'),
      RefundAmount: order.amount,
    });

    expect(refundResult.RtnCode).toBe(1);
    expect(refundResult.RefundAmount).toBe(order.amount);
  });

  it('should handle gateway errors', async () => {
    const failingGateway = new MockECPayGateway({
      shouldSucceed: false,
      customError: 'Gateway maintenance',
    });

    const order = generateTestOrder();

    await expect(
      failingGateway.createPayment({
        MerchantTradeNo: order.orderId,
        TotalAmount: order.amount,
      })
    ).rejects.toThrow('Gateway maintenance');
  });
});

describe('Cross-Gateway Compatibility', () => {
  it('should handle switching between gateways', async () => {
    const order = generateTestOrder();

    // Try NewebPay first
    const newebpay = new MockNewebPayGateway();
    const newebpayResult = await newebpay.createPayment({
      MerchantOrderNo: order.orderId,
      Amt: order.amount,
    });

    expect(newebpayResult.Status).toBe('SUCCESS');

    // Fallback to ECPay
    const ecpay = new MockECPayGateway();
    const ecpayResult = await ecpay.createPayment({
      MerchantTradeNo: order.orderId,
      TotalAmount: order.amount,
    });

    expect(ecpayResult.RtnCode).toBe('1');
  });

  it('should maintain consistent order tracking across gateways', async () => {
    const orderId = `TEST_ORDER_${Date.now()}`;

    const newebpay = new MockNewebPayGateway();
    const newebpayCallback = JSON.parse(newebpay.simulateCallback(orderId, true));

    const ecpay = new MockECPayGateway();
    const ecpayCallback = new URLSearchParams(ecpay.simulateCallback(orderId, true));

    expect(newebpayCallback.MerchantOrderNo).toBe(orderId);
    expect(ecpayCallback.get('MerchantTradeNo')).toBe(orderId);
  });
});
