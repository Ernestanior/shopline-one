/**
 * Mock Payment Gateway for Testing
 * Simulates NewebPay and ECPay responses without real credentials
 */

export interface MockPaymentConfig {
  shouldSucceed?: boolean;
  delay?: number;
  customError?: string;
}

export class MockNewebPayGateway {
  private config: MockPaymentConfig;

  constructor(config: MockPaymentConfig = {}) {
    this.config = { shouldSucceed: true, delay: 100, ...config };
  }

  async createPayment(data: any): Promise<any> {
    await this.simulateDelay();

    if (!this.config.shouldSucceed) {
      throw new Error(this.config.customError || 'Payment creation failed');
    }

    return {
      Status: 'SUCCESS',
      Message: '授權成功',
      Result: {
        MerchantID: 'TEST_MERCHANT',
        TradeNo: `TEST_${Date.now()}`,
        PaymentURL: `https://mock.newebpay.com/payment/${data.MerchantOrderNo}`,
        MerchantOrderNo: data.MerchantOrderNo,
        Amt: data.Amt,
      },
    };
  }

  async queryPayment(tradeNo: string): Promise<any> {
    await this.simulateDelay();

    if (!this.config.shouldSucceed) {
      throw new Error(this.config.customError || 'Query failed');
    }

    return {
      Status: 'SUCCESS',
      Message: '查詢成功',
      Result: {
        TradeNo: tradeNo,
        TradeStatus: '1', // 1=付款成功
        PaymentType: 'CREDIT',
        PayTime: new Date().toISOString(),
      },
    };
  }

  async refundPayment(data: any): Promise<any> {
    await this.simulateDelay();

    if (!this.config.shouldSucceed) {
      throw new Error(this.config.customError || 'Refund failed');
    }

    return {
      Status: 'SUCCESS',
      Message: '退款成功',
      Result: {
        TradeNo: data.TradeNo,
        RefundAmt: data.Amt,
        RefundTime: new Date().toISOString(),
      },
    };
  }

  simulateCallback(orderNo: string, success: boolean = true): string {
    const data = {
      Status: success ? 'SUCCESS' : 'FAILED',
      MerchantID: 'TEST_MERCHANT',
      TradeNo: `TEST_${Date.now()}`,
      MerchantOrderNo: orderNo,
      Amt: 1000,
      PaymentType: 'CREDIT',
      PayTime: new Date().toISOString(),
    };

    return JSON.stringify(data);
  }

  private async simulateDelay(): Promise<void> {
    if (this.config.delay) {
      await new Promise(resolve => setTimeout(resolve, this.config.delay));
    }
  }
}

export class MockECPayGateway {
  private config: MockPaymentConfig;

  constructor(config: MockPaymentConfig = {}) {
    this.config = { shouldSucceed: true, delay: 100, ...config };
  }

  async createPayment(data: any): Promise<any> {
    await this.simulateDelay();

    if (!this.config.shouldSucceed) {
      throw new Error(this.config.customError || 'Payment creation failed');
    }

    return {
      RtnCode: '1',
      RtnMsg: '交易成功',
      MerchantID: 'TEST_MERCHANT',
      MerchantTradeNo: data.MerchantTradeNo,
      TradeNo: `EC_${Date.now()}`,
      PaymentURL: `https://mock.ecpay.com.tw/payment/${data.MerchantTradeNo}`,
      TotalAmount: data.TotalAmount,
    };
  }

  async queryPayment(tradeNo: string): Promise<any> {
    await this.simulateDelay();

    if (!this.config.shouldSucceed) {
      throw new Error(this.config.customError || 'Query failed');
    }

    return {
      RtnCode: 1,
      RtnMsg: '查詢成功',
      TradeNo: tradeNo,
      TradeStatus: '1', // 1=交易成功
      PaymentType: 'Credit_CreditCard',
      PaymentDate: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
    };
  }

  async refundPayment(data: any): Promise<any> {
    await this.simulateDelay();

    if (!this.config.shouldSucceed) {
      throw new Error(this.config.customError || 'Refund failed');
    }

    return {
      RtnCode: 1,
      RtnMsg: '退款成功',
      TradeNo: data.TradeNo,
      RefundAmount: data.RefundAmount,
    };
  }

  simulateCallback(orderNo: string, success: boolean = true): string {
    const data = {
      RtnCode: success ? '1' : '0',
      RtnMsg: success ? '交易成功' : '交易失敗',
      MerchantID: 'TEST_MERCHANT',
      MerchantTradeNo: orderNo,
      TradeNo: `EC_${Date.now()}`,
      TradeAmt: 1000,
      PaymentType: 'Credit_CreditCard',
      PaymentDate: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
      TradeDate: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
    };

    return new URLSearchParams(data as any).toString();
  }

  private async simulateDelay(): Promise<void> {
    if (this.config.delay) {
      await new Promise(resolve => setTimeout(resolve, this.config.delay));
    }
  }
}

// Test data generators
export const generateTestOrder = (overrides: any = {}) => ({
  orderId: `TEST_ORDER_${Date.now()}`,
  amount: 1000,
  currency: 'TWD',
  description: 'Test Order',
  customerEmail: 'test@example.com',
  ...overrides,
});

export const generateTestCallback = (gateway: 'newebpay' | 'ecpay', success: boolean = true) => {
  if (gateway === 'newebpay') {
    return new MockNewebPayGateway().simulateCallback(`TEST_${Date.now()}`, success);
  } else {
    return new MockECPayGateway().simulateCallback(`TEST_${Date.now()}`, success);
  }
};
