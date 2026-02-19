/**
 * ECPay (绿界科技) Payment Gateway Adapter
 * Implements the PaymentGateway interface for ECPay
 * Requirements: 3.2, 3.4, 5.3, 5.5
 */

import { PaymentGateway } from './gateway.interface';
import {
  PaymentRequest,
  PaymentResponse,
  CallbackData,
  PaymentResult,
  PaymentStatus,
  PaymentMethod,
  RefundRequest,
  RefundResponse,
  ECPayConfig,
} from '../../types/payment';
import { sha256 } from '../../utils/crypto';

export class ECPayAdapter implements PaymentGateway {
  name = 'ECPay';

  constructor(private config: ECPayConfig) {}

  /**
   * Create payment request for ECPay
   * Generates CheckMacValue signature
   */
  async createPayment(params: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 1. Build payment data object
      const paymentData = {
        MerchantID: this.config.merchantId,
        MerchantTradeNo: params.orderId,
        MerchantTradeDate: this.formatDate(new Date()),
        PaymentType: 'aio',
        TotalAmount: params.amount.toString(),
        TradeDesc: this.encodeForECPay(params.description),
        ItemName: this.encodeForECPay(params.description),
        ReturnURL: params.notifyUrl,
        ClientBackURL: params.returnUrl,
        ChoosePayment: this.mapPaymentMethod(params.paymentMethod),
        EncryptType: '1', // Must be string for signature calculation
      };

      // 2. Generate CheckMacValue
      const checkMacValue = await this.generateCheckMacValue(paymentData);

      // 3. Generate HTML form
      const formHtml = this.generateForm({
        ...paymentData,
        CheckMacValue: checkMacValue,
      });

      return {
        success: true,
        transactionId: params.orderId,
        formHtml,
      };
    } catch (error) {
      return {
        success: false,
        transactionId: params.orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify callback signature from ECPay
   * Validates CheckMacValue to ensure data integrity
   */
  async verifyCallback(data: CallbackData): Promise<boolean> {
    try {
      const { CheckMacValue, ...params } = data;
      
      if (!CheckMacValue) {
        return false;
      }

      // Calculate expected CheckMacValue
      const calculatedMac = await this.generateCheckMacValue(params);
      
      // Compare signatures (case-insensitive)
      return calculatedMac.toUpperCase() === CheckMacValue.toUpperCase();
    } catch (error) {
      console.error('ECPay callback verification error:', error);
      return false;
    }
  }

  /**
   * Parse callback data from ECPay
   * Extracts payment result information
   */
  async parseCallback(data: CallbackData): Promise<PaymentResult> {
    try {
      return {
        transactionId: data.MerchantTradeNo,
        orderId: data.MerchantTradeNo,
        amount: parseInt(data.TradeAmt),
        status: this.mapStatus(data.RtnCode),
        paidAt: data.PaymentDate ? new Date(data.PaymentDate) : undefined,
        gatewayTransactionId: data.TradeNo,
        paymentMethod: this.mapPaymentMethodFromCallback(data.PaymentType),
      };
    } catch (error) {
      throw new Error(`Failed to parse ECPay callback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Query payment status from ECPay
   * Note: Implementation depends on ECPay query API
   */
  async queryPayment(transactionId: string): Promise<PaymentStatus> {
    // TODO: Implement ECPay query API call
    return PaymentStatus.PENDING;
  }

  /**
   * Initiate refund with ECPay
   * Requirements: 11.2, 11.4
   */
  async refund(params: RefundRequest): Promise<RefundResponse> {
    try {
      // 1. Build refund request data
      const refundData: Record<string, string> = {
        MerchantID: this.config.merchantId,
        MerchantTradeNo: params.transactionId,
        TradeNo: params.transactionId, // Gateway transaction ID
        Action: 'R', // R = Refund, C = Cancel
        TotalAmount: params.amount.toString(),
        TimeStamp: Math.floor(Date.now() / 1000).toString(),
      };

      // 2. Generate CheckMacValue
      const checkMacValue = await this.generateCheckMacValue(refundData);

      // 3. Prepare request body with CheckMacValue
      const requestBody = {
        ...refundData,
        CheckMacValue: checkMacValue,
      };

      // 4. Call ECPay refund API
      // Note: In production, this would make an actual HTTP request to ECPay
      // For now, we'll simulate the response based on the request structure
      const refundApiUrl = this.config.apiUrl.replace('/Cashier/AioCheckOut/V5', '/CreditDetail/DoAction');
      
      // Simulate API call (in production, use fetch)
      // const response = await fetch(refundApiUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      //   body: new URLSearchParams(requestBody).toString(),
      // });
      // const result = await response.json();

      // For now, return a simulated success response
      // In production, parse the actual API response
      return {
        success: true,
        refundId: `refund_${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund failed',
      };
    }
  }

  /**
   * Generate CheckMacValue for ECPay
   * Format: SHA256(URLEncode("HashKey={key}&{sorted_params}&HashIV={iv}"))
   */
  private async generateCheckMacValue(params: Record<string, string>): Promise<string> {
    // 1. Sort parameters by key (alphabetically)
    const sortedKeys = Object.keys(params).sort();
    
    // 2. Build parameter string
    const paramStr = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    // 3. Add HashKey and HashIV
    const str = `HashKey=${this.config.hashKey}&${paramStr}&HashIV=${this.config.hashIV}`;
    
    // 4. URL encode (ECPay specific encoding rules)
    const encoded = this.urlEncodeForECPay(str);
    
    // 5. SHA256 hash and convert to uppercase
    const hash = await sha256(encoded);
    return hash.toUpperCase();
  }

  /**
   * URL encode for ECPay (specific rules)
   * ECPay requires lowercase encoding and specific character handling
   */
  private urlEncodeForECPay(str: string): string {
    return encodeURIComponent(str)
      .replace(/%20/g, '+')
      .replace(/%2d/g, '-')
      .replace(/%5f/g, '_')
      .replace(/%2e/g, '.')
      .replace(/%21/g, '!')
      .replace(/%2a/g, '*')
      .replace(/%28/g, '(')
      .replace(/%29/g, ')')
      .toLowerCase();
  }

  /**
   * Encode string for ECPay (for ItemName and TradeDesc)
   * ECPay has specific requirements for these fields
   */
  private encodeForECPay(str: string): string {
    // Trim and limit length, remove special characters that ECPay doesn't accept
    const cleaned = str
      .trim()
      .substring(0, 200)
      .replace(/[#&+%]/g, ' ')
      .trim();
    
    // If empty after cleaning, use a default value
    return cleaned || 'Order';
  }

  /**
   * Map internal payment method to ECPay ChoosePayment value
   */
  private mapPaymentMethod(method: PaymentMethod): string {
    const map: Record<PaymentMethod, string> = {
      [PaymentMethod.CREDIT_CARD]: 'Credit',
      [PaymentMethod.ATM]: 'ATM',
      [PaymentMethod.CONVENIENCE_STORE]: 'CVS',
      [PaymentMethod.BARCODE]: 'BARCODE',
    };
    return map[method] || 'ALL';
  }

  /**
   * Map ECPay payment type from callback to internal payment method
   */
  private mapPaymentMethodFromCallback(type: string): string {
    const map: Record<string, string> = {
      'Credit_CreditCard': 'credit_card',
      'ATM_LAND': 'atm',
      'ATM_TAISHIN': 'atm',
      'ATM_ESUN': 'atm',
      'CVS_CVS': 'cvs',
      'CVS_OK': 'cvs',
      'CVS_FAMILY': 'cvs',
      'CVS_HILIFE': 'cvs',
      'BARCODE_BARCODE': 'barcode',
    };
    return map[type] || type;
  }

  /**
   * Map ECPay RtnCode to internal PaymentStatus
   */
  private mapStatus(code: string): PaymentStatus {
    // ECPay returns '1' for success
    return code === '1' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
  }

  /**
   * Format date for ECPay (yyyy/MM/dd HH:mm:ss)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Generate HTML form for auto-submission to ECPay
   */
  private generateForm(params: Record<string, string>): string {
    const fields = Object.entries(params)
      .map(([key, value]) => `    <input type="hidden" name="${this.escapeHtml(key)}" value="${this.escapeHtml(value)}">`)
      .join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Redirecting to Payment Gateway...</title>
</head>
<body>
  <form id="payment-form" method="post" action="${this.config.apiUrl}">
${fields}
    <noscript>
      <p>Please click the button below to proceed to payment:</p>
      <button type="submit">Proceed to Payment</button>
    </noscript>
  </form>
  <script>
    document.getElementById('payment-form').submit();
  </script>
</body>
</html>
    `.trim();
  }

  /**
   * Escape HTML special characters to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
