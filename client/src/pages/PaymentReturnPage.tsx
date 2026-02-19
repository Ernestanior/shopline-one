import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../lib/api';
import Reveal from '../components/Reveal';
import './PaymentReturnPage.css';

interface PaymentStatus {
  transactionId: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'expired' | 'refunded' | 'cancelled';
  paidAt?: string;
  gatewayTransactionId: string;
  paymentMethod: string;
}

export default function PaymentReturnPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [pollCount, setPollCount] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('订单ID缺失');
      setLoading(false);
      return;
    }

    // Initial check
    checkPaymentStatus();

    // Poll every 5 seconds for up to 1 minute (12 times)
    intervalRef.current = setInterval(() => {
      setPollCount((count) => {
        if (count >= 12) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          return count;
        }
        checkPaymentStatus();
        return count + 1;
      });
    }, 5000);

    // Stop polling after 1 minute
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const checkPaymentStatus = async () => {
    try {
      const data = await apiFetch<PaymentStatus>(`/api/payment/status/${orderId}`);
      
      setPaymentStatus(data);
      setLoading(false);

      // Stop polling if payment is in a final state
      if (data.status === 'success' || data.status === 'failed' || data.status === 'expired') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    } catch (err: any) {
      console.error('Failed to check payment status:', err);
      setError(err.message || '查询支付状态失败');
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (orderId) {
      navigate(`/checkout/${orderId}`);
    }
  };

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !paymentStatus) {
    return (
      <div className="payment-return-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>查询支付状态中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !paymentStatus) {
    return (
      <div className="payment-return-page">
        <div className="container">
          <Reveal>
            <div className="error-state">
              <div className="status-icon error">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
              <h2>查询失败</h2>
              <p>{error}</p>
              <Link to="/" className="btn-primary">
                返回首页
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  if (!paymentStatus) {
    return (
      <div className="payment-return-page">
        <div className="container">
          <Reveal>
            <div className="error-state">
              <h2>未找到支付记录</h2>
              <p>无法找到该订单的支付信息</p>
              <Link to="/" className="btn-primary">
                返回首页
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-return-page">
      <div className="container">
        {paymentStatus.status === 'success' && (
          <Reveal>
            <div className="payment-result success">
              <div className="status-icon success">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h2>支付成功！</h2>
              <p className="success-message">您的订单已成功支付</p>
              
              <div className="payment-details">
                <div className="detail-row">
                  <span className="detail-label">订单编号</span>
                  <span className="detail-value">{paymentStatus.orderId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">支付金额</span>
                  <span className="detail-value">NT$ {formatAmount(paymentStatus.amount)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">支付方式</span>
                  <span className="detail-value">{paymentStatus.paymentMethod}</span>
                </div>
                {paymentStatus.paidAt && (
                  <div className="detail-row">
                    <span className="detail-label">支付时间</span>
                    <span className="detail-value">{formatDate(paymentStatus.paidAt)}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">交易编号</span>
                  <span className="detail-value">{paymentStatus.gatewayTransactionId}</span>
                </div>
              </div>

              <div className="action-buttons">
                {user && (
                  <Link to={`/orders/${paymentStatus.orderId}`} className="btn-primary">
                    查看订单详情
                  </Link>
                )}
                <Link to="/" className="btn-secondary">
                  返回首页
                </Link>
              </div>
            </div>
          </Reveal>
        )}

        {paymentStatus.status === 'pending' && (
          <Reveal>
            <div className="payment-result pending">
              <div className="status-icon pending">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h2>等待支付确认</h2>
              <p className="pending-message">您的支付正在处理中，请稍候...</p>
              
              <div className="polling-indicator">
                <div className="spinner small"></div>
                <span>自动刷新中 ({pollCount}/12)</span>
              </div>

              <div className="payment-details">
                <div className="detail-row">
                  <span className="detail-label">订单编号</span>
                  <span className="detail-value">{paymentStatus.orderId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">支付金额</span>
                  <span className="detail-value">NT$ {formatAmount(paymentStatus.amount)}</span>
                </div>
              </div>

              <div className="action-buttons">
                <button onClick={checkPaymentStatus} className="btn-secondary">
                  手动刷新
                </button>
                <Link to="/" className="btn-secondary">
                  返回首页
                </Link>
              </div>
            </div>
          </Reveal>
        )}

        {paymentStatus.status === 'failed' && (
          <Reveal>
            <div className="payment-result failed">
              <div className="status-icon failed">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
              <h2>支付失败</h2>
              <p className="failed-message">很抱歉，您的支付未能完成</p>
              
              <div className="payment-details">
                <div className="detail-row">
                  <span className="detail-label">订单编号</span>
                  <span className="detail-value">{paymentStatus.orderId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">支付金额</span>
                  <span className="detail-value">NT$ {formatAmount(paymentStatus.amount)}</span>
                </div>
              </div>

              <div className="action-buttons">
                <button onClick={handleRetry} className="btn-primary">
                  重新支付
                </button>
                <Link to="/" className="btn-secondary">
                  返回首页
                </Link>
              </div>
            </div>
          </Reveal>
        )}

        {(paymentStatus.status === 'expired' || paymentStatus.status === 'cancelled') && (
          <Reveal>
            <div className="payment-result expired">
              <div className="status-icon expired">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <h2>支付已{paymentStatus.status === 'expired' ? '过期' : '取消'}</h2>
              <p>此支付已{paymentStatus.status === 'expired' ? '超时' : '被取消'}，请重新发起支付</p>
              
              <div className="action-buttons">
                <button onClick={handleRetry} className="btn-primary">
                  重新支付
                </button>
                <Link to="/" className="btn-secondary">
                  返回首页
                </Link>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
