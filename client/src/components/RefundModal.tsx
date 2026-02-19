import React, { useState } from 'react';
import { apiFetch } from '../lib/api';
import './RefundModal.css';

interface RefundModalProps {
  transaction: {
    id: string;
    orderId: string;
    amount: number;
    currency: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function RefundModal({ transaction, onClose, onSuccess }: RefundModalProps) {
  const [amount, setAmount] = useState<string>((transaction.amount / 100).toFixed(2));
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const maxAmount = transaction.amount / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const refundAmount = parseFloat(amount);
    
    if (isNaN(refundAmount) || refundAmount <= 0) {
      setError('请输入有效的退款金额');
      return;
    }

    if (refundAmount > maxAmount) {
      setError(`退款金额不能超过 ${maxAmount.toFixed(2)}`);
      return;
    }

    if (!reason.trim()) {
      setError('请输入退款原因');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await apiFetch('/api/payment/refund', {
        method: 'POST',
        json: {
          orderId: transaction.orderId,
          amount: Math.round(refundAmount * 100), // Convert to cents
          reason: reason.trim(),
        },
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Refund failed:', err);
      setError(err.message || '退款失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="refund-modal-overlay" onClick={onClose}>
      <div className="refund-modal" onClick={(e) => e.stopPropagation()}>
        <div className="refund-modal-header">
          <h3>退款申请</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="refund-form">
          <div className="transaction-info">
            <div className="info-row">
              <span className="info-label">订单ID:</span>
              <span className="info-value">{transaction.orderId}</span>
            </div>
            <div className="info-row">
              <span className="info-label">原始金额:</span>
              <span className="info-value">
                {transaction.currency} {maxAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="refund-amount">退款金额 *</label>
            <div className="amount-input-wrapper">
              <span className="currency-prefix">{transaction.currency}</span>
              <input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={maxAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <span className="input-hint">
              最大可退款金额: {transaction.currency} {maxAmount.toFixed(2)}
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="refund-reason">退款原因 *</label>
            <textarea
              id="refund-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请输入退款原因..."
              required
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-danger"
              disabled={loading}
            >
              {loading ? '处理中...' : '确认退款'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RefundModal;
