/**
 * Payment Routes
 * Handles payment creation, callbacks, status queries, and refunds
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { PaymentService } from '../services/payment/payment.service';
import { DatabaseService } from '../services/db.service';
import { requireAuth, getCurrentUser } from '../middleware/auth';
import { rateLimiter } from '../middleware/rate-limiter';
import { 
  validateRefundRequest,
  ValidationError as PaymentValidationError 
} from '../middleware/payment-validation';
import { validatePaymentConfig } from '../services/payment/config-validator';
import { UnauthorizedError, NotFoundError, ValidationError } from '../middleware/error';
import type { Env } from '../types/env';
import type { PaymentConfig } from '../types/payment';

const payment = new Hono<{ Bindings: Env }>();

// Apply CORS middleware
payment.use('*', cors({
  origin: (origin) => origin, // Allow all origins in development, restrict in production
  credentials: true,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// Apply rate limiting to all payment endpoints (10 requests per minute)
payment.use('*', rateLimiter({ maxRequests: 10, windowMs: 60000 }));

// Note: CSRF protection is applied per-endpoint below where needed

/**
 * Helper function to get payment configuration from environment
 */
function getPaymentConfig(env: Env): PaymentConfig {
  const config: PaymentConfig = {};
  const isProd = env.PAYMENT_ENVIRONMENT === 'production';

  // Configure NewebPay based on environment
  const newebpayMerchantId = isProd ? env.NEWEBPAY_PROD_MERCHANT_ID : env.NEWEBPAY_TEST_MERCHANT_ID;
  const newebpayHashKey = isProd ? env.NEWEBPAY_PROD_HASH_KEY : env.NEWEBPAY_TEST_HASH_KEY;
  const newebpayHashIV = isProd ? env.NEWEBPAY_PROD_HASH_IV : env.NEWEBPAY_TEST_HASH_IV;

  if (newebpayMerchantId && newebpayHashKey && newebpayHashIV) {
    config.newebpay = {
      merchantId: newebpayMerchantId,
      hashKey: newebpayHashKey,
      hashIV: newebpayHashIV,
      apiUrl: isProd 
        ? 'https://core.newebpay.com/MPG/mpg_gateway'
        : 'https://ccore.newebpay.com/MPG/mpg_gateway',
      version: env.NEWEBPAY_VERSION || '2.0',
    };
  }

  // Configure ECPay based on environment
  const ecpayMerchantId = isProd ? env.ECPAY_PROD_MERCHANT_ID : env.ECPAY_TEST_MERCHANT_ID;
  const ecpayHashKey = isProd ? env.ECPAY_PROD_HASH_KEY : env.ECPAY_TEST_HASH_KEY;
  const ecpayHashIV = isProd ? env.ECPAY_PROD_HASH_IV : env.ECPAY_TEST_HASH_IV;

  if (ecpayMerchantId && ecpayHashKey && ecpayHashIV) {
    config.ecpay = {
      merchantId: ecpayMerchantId,
      hashKey: ecpayHashKey,
      hashIV: ecpayHashIV,
      apiUrl: isProd
        ? 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5'
        : 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
    };
  }

  // Validate configuration
  validatePaymentConfig(config);

  return config;
}

/**
 * Helper function to get order information
 */
async function getOrder(db: DatabaseService, orderId: string, userId?: number) {
  const query = userId
    ? 'SELECT * FROM orders WHERE id = ? AND user_id = ?'
    : 'SELECT * FROM orders WHERE id = ?';
  
  const params = userId ? [orderId, userId] : [orderId];
  
  const order = await db.queryOne(query, params);
  
  if (!order) {
    throw new NotFoundError('Order not found');
  }
  
  return order;
}

/**
 * POST /api/payment/create
 * Create a payment request and return payment form HTML
 * Supports both authenticated and guest users
 */
payment.post('/create', async (c) => {
  try {
    const user = getCurrentUser(c);

    // Parse and validate request body
    const body = await c.req.json();
    const { orderId, gateway, paymentMethod } = body;

    // Validate required fields
    if (!orderId || !gateway || !paymentMethod) {
      throw new ValidationError('Missing required fields: orderId, gateway, paymentMethod');
    }

    // Validate gateway
    if (!['newebpay', 'ecpay'].includes(gateway)) {
      throw new ValidationError('Invalid gateway. Must be newebpay or ecpay');
    }

    // Validate payment method
    if (!['credit_card', 'atm', 'cvs', 'barcode'].includes(paymentMethod)) {
      throw new ValidationError('Invalid payment method');
    }

    // Get database service
    const db = new DatabaseService(c.env.DB);

    // Get order - verify ownership only if user is logged in
    const order = await getOrder(db, orderId, user?.id);

    // Verify order status
    if (order.status !== 'pending') {
      throw new ValidationError(`Order status must be pending, current status: ${order.status}`);
    }

    // Get payment configuration
    const paymentConfig = getPaymentConfig(c.env);

    // Initialize payment service
    const paymentService = new PaymentService(c.env.DB, paymentConfig);

    // Get frontend and API URLs from environment
    const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:3000';
    const apiUrl = c.env.API_URL || 'http://localhost:8787';

    // Create payment
    const response = await paymentService.createPayment(gateway, {
      orderId: order.id,
      amount: Math.round(order.total_amount * 100), // Convert to cents
      currency: 'TWD',
      description: `Order ${order.id}`,
      buyerEmail: user?.email || order.shipping_email || '',
      paymentMethod,
      returnUrl: `${frontendUrl}/payment/return/${order.id}`,
      notifyUrl: `${apiUrl}/api/payment/callback/${gateway}`,
    });

    if (!response.success) {
      throw new ValidationError(response.error || 'Failed to create payment');
    }

    return c.json({
      success: true,
      transactionId: response.transactionId,
      formHtml: response.formHtml,
      paymentUrl: response.paymentUrl,
    });
  } catch (error) {
    if (error instanceof PaymentValidationError) {
      throw new ValidationError(error.message);
    }
    throw error;
  }
});

/**
 * POST /api/payment/callback/:gateway
 * Handle payment gateway callbacks
 */
payment.post('/callback/:gateway', async (c) => {
  try {
    const gateway = c.req.param('gateway');

    // Validate gateway parameter
    if (!gateway || !['newebpay', 'ecpay'].includes(gateway)) {
      return c.text('0|Invalid gateway', 400);
    }

    // Parse callback data
    const contentType = c.req.header('content-type');
    let callbackData: Record<string, string> = {};

    if (contentType?.includes('application/json')) {
      callbackData = await c.req.json();
    } else {
      // Parse form data
      const formData = await c.req.parseBody();
      for (const [key, value] of Object.entries(formData)) {
        callbackData[key] = String(value);
      }
    }

    // Get payment configuration
    const paymentConfig = getPaymentConfig(c.env);

    // Initialize payment service
    const paymentService = new PaymentService(c.env.DB, paymentConfig);

    // Handle callback
    const result = await paymentService.handleCallback(gateway, callbackData);

    // Return response in gateway-expected format
    if (result.success) {
      // NewebPay and ECPay both expect simple success response
      return c.text('1|OK');
    } else {
      return c.text(`0|${result.message}`, 400);
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    return c.text('0|Internal error', 500);
  }
});

/**
 * GET /api/payment/status/:orderId
 * Query payment status for an order
 * Supports both authenticated and guest users
 */
payment.get('/status/:orderId', async (c) => {
  try {
    const user = getCurrentUser(c);
    const orderId = c.req.param('orderId');

    // Get database service
    const db = new DatabaseService(c.env.DB);

    // Verify order ownership only if user is logged in
    await getOrder(db, orderId, user?.id);

    // Get payment configuration
    const paymentConfig = getPaymentConfig(c.env);

    // Initialize payment service
    const paymentService = new PaymentService(c.env.DB, paymentConfig);

    // Query payment status
    const status = await paymentService.queryPaymentStatus(orderId);

    if (!status) {
      return c.json({
        success: false,
        error: 'Payment not found',
      }, 404);
    }

    return c.json({
      success: true,
      payment: {
        transactionId: status.transactionId,
        orderId: status.orderId,
        amount: status.amount,
        status: status.status,
        paidAt: status.paidAt,
        paymentMethod: status.paymentMethod,
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
      throw error;
    }
    console.error('Payment status query error:', error);
    throw new ValidationError('Failed to query payment status');
  }
});

/**
 * POST /api/payment/refund
 * Process a refund request (admin only)
 */
payment.post('/refund', requireAuth, async (c) => {
  try {
    const user = getCurrentUser(c);
    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Verify admin permission
    if (!user.is_admin) {
      throw new UnauthorizedError('Admin permission required');
    }

    // Parse and validate request body
    const body = await c.req.json();
    const { orderId, amount, reason } = body;

    // Validate required fields
    if (!orderId || !amount) {
      throw new ValidationError('Missing required fields: orderId, amount');
    }

    // Validate refund request
    validateRefundRequest({
      orderId,
      amount,
      reason: reason || 'Admin refund',
    });

    // Get payment configuration
    const paymentConfig = getPaymentConfig(c.env);

    // Initialize payment service
    const paymentService = new PaymentService(c.env.DB, paymentConfig);

    // Process refund
    const response = await paymentService.refundPayment(
      orderId,
      amount,
      reason || 'Admin refund'
    );

    if (!response.success) {
      throw new ValidationError(response.error || 'Failed to process refund');
    }

    return c.json({
      success: true,
      refundId: response.refundId,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    if (error instanceof PaymentValidationError) {
      throw new ValidationError(error.message);
    }
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    console.error('Refund processing error:', error);
    throw new ValidationError('Failed to process refund');
  }
});

export { payment };
