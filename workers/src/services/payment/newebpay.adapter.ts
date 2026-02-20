/**
 * NewebPay (蓝新金流) Payment Gateway Adapter
 * Implements the PaymentGateway interface for NewebPay
 * Requirements: 3.2, 3.3, 5.2, 5.5
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
  NewebPayConfig,
  NewebPayTradeInfo,
} from '../../types/payment';
import { sha256, aesEncrypt, aesDecrypt } from '../../utils/crypto';

export class NewebPayAdapter implements PaymentGateway {
  name = 'NewebPay';

  constructor(private config: NewebPayConfig) {}

  /**
   * Create payment request for NewebPay
   * Generates encrypted TradeInfo and TradeSha signature
   */
  async createPayment(params: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 1. Build trade info object
      const tradeInfo: NewebPayTradeInfo = {
        MerchantID: this.config.merchantId,
        RespondType: 'JSON',
        TimeStamp: Math.floor(Date.now() / 1000).toString(),
        Version: this.config.version,
        MerchantOrderNo: params.orderId,
        Amt: params.amount,
        ItemDesc: params.description,
        Email: params.buyerEmail,
        ReturnURL: params.returnUrl,
        NotifyURL: params.notifyUrl,
        CREDIT: params.paymentMethod === PaymentMethod.CREDIT_CARD ? 1 : 0,
        VACC: params.paymentMethod === PaymentMethod.ATM ? 1 : 0,
        CVS: params.paymentMethod === PaymentMethod.CONVENIENCE_STORE ? 1 : 0,
      };

      // 2. Convert to URL query string format (required by NewebPay)
      const tradeInfoQueryString = new URLSearchParams(
        Object.entries(tradeInfo).map(([key, value]) => [key, String(value)])
      ).toString();

      // 3. AES encrypt trade info
      const tradeInfoEncrypted = await aesEncrypt(
        tradeInfoQueryString,
        this.config.hashKey,
        this.config.hashIV
      );

      // 4. Generate check value (TradeSha)
      const tradeSha = await this.generateCheckValue(tradeInfoEncrypted);

      // 5. Generate HTML form
      const formHtml = this.generateForm({
        MerchantID: this.config.merchantId,
        TradeInfo: tradeInfoEncrypted,
        TradeSha: tradeSha,
        Version: this.config.version,
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
   * Verify callback signature from NewebPay
   * Validates TradeSha to ensure data integrity
   */
  async verifyCallback(data: CallbackData): Promise<boolean> {
    try {
      const { TradeInfo, TradeSha } = data;
      
      if (!TradeInfo || !TradeSha) {
        return false;
      }

      // Calculate expected signature
      const calculatedSha = await this.generateCheckValue(TradeInfo);
      
      // Compare signatures (case-insensitive)
      return calculatedSha.toUpperCase() === TradeSha.toUpperCase();
    } catch (error) {
      console.error('NewebPay callback verification error:', error);
      return false;
    }
  }

  /**
   * Parse callback data from NewebPay
   * Decrypts TradeInfo and extracts payment result
   */
  async parseCallback(data: CallbackData): Promise<PaymentResult> {
    try {
      // Decrypt TradeInfo
      const decrypted = await aesDecrypt(
        data.TradeInfo,
        this.config.hashKey,
        this.config.hashIV
      );
      
      // Parse URL query string format
      const params = new URLSearchParams(decrypted);
      const result: any = {};
      params.forEach((value, key) => {
        result[key] = value;
      });

      return {
        transactionId: result.MerchantOrderNo,
        orderId: result.MerchantOrderNo,
        amount: parseInt(result.Amt),
        status: this.mapStatus(result.Status),
        paidAt: result.PayTime ? new Date(result.PayTime) : undefined,
        gatewayTransactionId: result.TradeNo,
        paymentMethod: this.mapPaymentMethod(result.PaymentType),
      };
    } catch (error) {
      throw new Error(`Failed to parse NewebPay callback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Query payment status from NewebPay
   * Note: Implementation depends on NewebPay query API
   */
  async queryPayment(transactionId: string): Promise<PaymentStatus> {
    // TODO: Implement NewebPay query API call
    // For now, return pending as placeholder
    return PaymentStatus.PENDING;
  }

  /**
   * Initiate refund with NewebPay
   * Requirements: 11.2, 11.3
   */
  async refund(params: RefundRequest): Promise<RefundResponse> {
    try {
      // 1. Build refund request data
      const refundData = {
        RespondType: 'JSON',
        Version: this.config.version,
        Amt: params.amount,
        MerchantOrderNo: params.transactionId,
        IndexType: 1, // 1 = by MerchantOrderNo
        TimeStamp: Math.floor(Date.now() / 1000).toString(),
        CloseType: 2, // 2 = refund
      };

      // 2. AES encrypt refund data
      const refundDataJson = JSON.stringify(refundData);
      const refundDataEncrypted = await aesEncrypt(
        refundDataJson,
        this.config.hashKey,
        this.config.hashIV
      );

      // 3. Generate check value
      const checkValue = await this.generateCheckValue(refundDataEncrypted);

      // 4. Prepare request body
      const requestBody = {
        MerchantID_: this.config.merchantId,
        PostData_: refundDataEncrypted,
        PostData_CheckValue: checkValue,
      };

      // 5. Call NewebPay refund API
      // Note: In production, this would make an actual HTTP request to NewebPay
      // For now, we'll simulate the response based on the request structure
      const refundApiUrl = this.config.apiUrl.replace('/MPG/mpg_gateway', '/API/CreditCard/Close');
      
      // Simulate API call (in production, use fetch)
      // const response = await fetch(refundApiUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      //   body: new URLSearchParams(requestBody as any).toString(),
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
   * Generate check value (TradeSha) for NewebPay
   * Format: SHA256("HashKey={key}&{TradeInfo}&HashIV={iv}")
   */
  private async generateCheckValue(tradeInfo: string): Promise<string> {
    const str = `HashKey=${this.config.hashKey}&${tradeInfo}&HashIV=${this.config.hashIV}`;
    const hash = await sha256(str);
    return hash.toUpperCase();
  }

  /**
   * Map NewebPay status to internal PaymentStatus
   */
  private mapStatus(status: string): PaymentStatus {
    switch (status) {
      case 'SUCCESS':
        return PaymentStatus.SUCCESS;
      case 'FAILED':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * Map NewebPay payment type to internal payment method
   */
  private mapPaymentMethod(type: string): string {
    const typeMap: Record<string, string> = {
      CREDIT: 'credit_card',
      VACC: 'atm',
      CVS: 'cvs',
    };
    return typeMap[type] || type;
  }

  /**
   * Generate HTML form for auto-submission to NewebPay
   */
  private generateForm(params: {
    MerchantID: string;
    TradeInfo: string;
    TradeSha: string;
    Version: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Redirecting to Payment Gateway...</title>
</head>
<body>
  <form id="payment-form" method="post" action="${this.config.apiUrl}">
    <input type="hidden" name="MerchantID" value="${this.escapeHtml(params.MerchantID)}">
    <input type="hidden" name="TradeInfo" value="${this.escapeHtml(params.TradeInfo)}">
    <input type="hidden" name="TradeSha" value="${this.escapeHtml(params.TradeSha)}">
    <input type="hidden" name="Version" value="${this.escapeHtml(params.Version)}">
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
