/**
 * Cron Job: Expire Payments
 * Handles expiration of pending payment transactions
 * Requirements: 10.4, 10.5
 * 
 * This job runs periodically to:
 * 1. Query all pending/processing transactions that have passed their expiration time
 * 2. Update their status to 'expired'
 * 3. Log the expiration events
 */

import { PaymentStatus } from '../types/payment';
import { createLogger } from '../utils/logger';

const logger = createLogger();

/**
 * Process expired payments
 * Queries the database for transactions that have expired and updates their status
 */
export async function expirePayments(db: D1Database): Promise<{
  processed: number;
  errors: number;
}> {
  const startTime = Date.now();
  let processed = 0;
  let errors = 0;

  logger.info('Starting expired payments processing', {
    timestamp: new Date().toISOString(),
  });

  try {
    // Query all pending/processing transactions that have expired
    const now = new Date().toISOString();
    const expiredTransactions = await db
      .prepare(
        `SELECT id, order_id, gateway, amount, payment_method, expired_at
         FROM payment_transactions
         WHERE status IN (?, ?)
         AND expired_at IS NOT NULL
         AND expired_at < ?
         ORDER BY expired_at ASC`
      )
      .bind(PaymentStatus.PENDING, PaymentStatus.PROCESSING, now)
      .all();

    if (!expiredTransactions.results || expiredTransactions.results.length === 0) {
      logger.info('No expired payments found', {
        timestamp: new Date().toISOString(),
      });
      return { processed: 0, errors: 0 };
    }

    logger.info('Found expired payments', {
      count: expiredTransactions.results.length,
      timestamp: new Date().toISOString(),
    });

    // Process each expired transaction
    for (const transaction of expiredTransactions.results) {
      try {
        // Update transaction status to expired
        await db
          .prepare(
            `UPDATE payment_transactions
             SET status = ?, updated_at = ?
             WHERE id = ?`
          )
          .bind(PaymentStatus.EXPIRED, new Date().toISOString(), transaction.id)
          .run();

        // Update order status to payment_expired
        await db
          .prepare(
            `UPDATE orders
             SET status = ?, updated_at = ?
             WHERE id = ?`
          )
          .bind('payment_expired', new Date().toISOString(), transaction.order_id)
          .run();

        logger.info('Payment expired', {
          transactionId: transaction.id,
          orderId: transaction.order_id,
          gateway: transaction.gateway,
          amount: transaction.amount,
          paymentMethod: transaction.payment_method,
          expiredAt: transaction.expired_at,
          timestamp: new Date().toISOString(),
        });

        processed++;
      } catch (error) {
        logger.error('Failed to expire payment', {
          transactionId: transaction.id,
          orderId: transaction.order_id,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
        errors++;
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Expired payments processing completed', {
      processed,
      errors,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return { processed, errors };
  } catch (error) {
    logger.error('Expired payments processing failed', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Scheduled handler for Cloudflare Workers Cron Trigger
 * This function is called by the Cloudflare Workers runtime on the configured schedule
 */
export async function handleScheduled(
  event: ScheduledEvent,
  env: { DB: D1Database },
  ctx: ExecutionContext
): Promise<void> {
  logger.info('Cron trigger fired', {
    scheduledTime: new Date(event.scheduledTime).toISOString(),
    cron: event.cron,
  });

  try {
    const result = await expirePayments(env.DB);
    
    logger.info('Cron job completed', {
      processed: result.processed,
      errors: result.errors,
      scheduledTime: new Date(event.scheduledTime).toISOString(),
    });
  } catch (error) {
    logger.error('Cron job failed', {
      error: error instanceof Error ? error.message : String(error),
      scheduledTime: new Date(event.scheduledTime).toISOString(),
    });
    // Don't throw - we want the cron job to continue running on schedule
  }
}
