import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import './OrderDetail.css';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number | string;
  subtotal: number | string;
}

interface Order {
  id: number;
  order_number: string;
  total_amount: number | string;
  status: string;
  payment_status: string;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  created_at: string;
  items: OrderItem[];
}

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast, showConfirm } = useNotification();
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[OrderDetail] Fetching order:', id);
      
      // Try admin API first, fallback to user API
      try {
        console.log('[OrderDetail] Trying admin API...');
        const data = await apiFetch<{ order: Order }>(`/api/admin/orders/${id}`);
        console.log('[OrderDetail] Admin API response:', data);
        // Both admin and user APIs return { order: ... }
        setOrder(data.order);
        console.log('[OrderDetail] Order set successfully');
      } catch (adminError) {
        console.log('[OrderDetail] Admin API failed, trying user API...', adminError);
        // If admin API fails, try user API
        const userData = await apiFetch<{ order: Order }>(`/api/user/orders/${id}`);
        console.log('[OrderDetail] User API response:', userData);
        setOrder(userData.order);
        console.log('[OrderDetail] Order set successfully from user API');
      }
    } catch (err) {
      console.error('[OrderDetail] Failed to fetch order:', err);
      setError(t('orderDetail.cannotLoad'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      shipped: '#8b5cf6',
      completed: '#10b981',
      cancelled: '#ef4444'
    };
    return colors[status] || '#666666';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: t('order.status.pending'),
      processing: t('order.status.processing'),
      shipped: t('order.status.shipped'),
      completed: t('order.status.delivered'),
      cancelled: t('order.status.cancelled')
    };
    return texts[status] || status;
  };

  const parseAddress = (addressStr: string) => {
    try {
      return JSON.parse(addressStr);
    } catch {
      return null;
    }
  };

  if (loading) {
    console.log('[OrderDetail] Rendering: loading state');
    return (
      <div className="order-detail">
        <div className="container">
          <div className="loading-state">{t('orderDetail.loading')}</div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    console.log('[OrderDetail] Rendering: error state', { error, hasOrder: !!order });
    return (
      <div className="order-detail">
        <div className="container">
          <div className="error-state">
            <h2>{error || t('orderDetail.notFound')}</h2>
            <Link to="/account" className="btn-primary">{t('orderDetail.backToAccount')}</Link>
          </div>
        </div>
      </div>
    );
  }

  console.log('[OrderDetail] Rendering: order detail', order);

  const address = parseAddress(order.shipping_address);

  return (
    <div className="order-detail">
      <div className="container">
        <div className="order-detail-header">
          <button onClick={() => navigate(-1)} className="btn-back">
            {t('orderDetail.back')}
          </button>
          <h1>{ t('orderDetail.title')}</h1>
        </div>

        <div className="order-detail-grid">
          <div className="order-detail-main">
            {/* Order Info */}
            <div className="detail-card">
              <h2>{ t('orderDetail.orderInfo')}</h2>
              <div className="detail-row">
                <span className="detail-label">{ t('orderDetail.orderNumber')}</span>
                <span className="detail-value">{order.order_number}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{ t('orderDetail.orderTime')}</span>
                <span className="detail-value">
                  {new Date(order.created_at).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{ t('orderDetail.orderStatus')}</span>
                <span 
                  className="detail-value status"
                  style={{ color: getStatusColor(order.status) }}
                >
                  {getStatusText(order.status)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{ t('orderDetail.paymentStatus')}</span>
                <span className="detail-value">
                  {order.payment_status === 'paid' ? t('orderDetail.paid') : t('orderDetail.unpaid')}
                </span>
              </div>
              
              {/* 操作按钮 */}
              <div className="order-actions">
                {order.payment_status === 'unpaid' && (
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      // Navigate to payment page with order ID
                      navigate(`/checkout/payment/${order.id}`);
                    }}
                  >
                    {t('orderDetail.payNow')}
                  </button>
                )}
                <button 
                  className="btn-delete"
                  onClick={async () => {
                    const confirmed = await showConfirm({
                      title: t('orderDetail.deleteConfirmTitle'),
                      message: t('orderDetail.deleteConfirmMessage'),
                      type: 'danger',
                      confirmText: t('orderDetail.deleteConfirmButton'),
                      cancelText: t('orderDetail.cancelButton')
                    });

                    if (confirmed) {
                      try {
                        await apiFetch(`/api/user/orders/${order.id}`, {
                          method: 'DELETE'
                        });
                        showToast({ message: t('orderDetail.deleteSuccess'), type: 'success' });
                        setTimeout(() => navigate('/account'), 1000);
                      } catch (error) {
                        showToast({ message: t('orderDetail.deleteFailed'), type: 'error' });
                      }
                    }
                  }}
                >
                  删除订单
                </button>
              </div>
            </div>

            {/* Product List */}
            <div className="detail-card">
              <h2>{ t('orderDetail.productList')}</h2>
              <div className="order-items">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id} className="order-item">
                      <div className="item-image">
                        <img 
                          src={item.product_image} 
                          alt={item.product_name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                          }}
                        />
                      </div>
                      <div className="item-info">
                        <div className="item-name">{item.product_name}</div>
                        <div className="item-meta">
                          <span>{ t('orderDetail.quantity')}: {item.quantity}</span>
                          <span>{ t('orderDetail.unitPrice')}: ${item.price ? (typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2)) : '0.00'}</span>
                        </div>
                      </div>
                      <div className="item-total">
                        ${item.subtotal ? (typeof item.subtotal === 'string' ? parseFloat(item.subtotal).toFixed(2) : item.subtotal.toFixed(2)) : '0.00'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-items">{ t('orderDetail.noProducts')}</div>
                )}
              </div>
            </div>
          </div>

          <div className="order-detail-sidebar">
            {/* Shipping Info */}
            <div className="detail-card">
              <h2>{ t('orderDetail.shippingInfo')}</h2>
              <div className="shipping-info">
                <div className="info-item">
                  <div className="info-label">{ t('orderDetail.recipient')}</div>
                  <div className="info-value">{order.shipping_name}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">{ t('orderDetail.phone')}</div>
                  <div className="info-value">{order.shipping_phone || t('orderDetail.notProvided')}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">{ t('orderDetail.email')}</div>
                  <div className="info-value">{order.shipping_email}</div>
                </div>
                {address && (
                  <div className="info-item">
                    <div className="info-label">{ t('orderDetail.address')}</div>
                    <div className="info-value">
                      {address.address1}
                      {address.address2 && `, ${address.address2}`}
                      <br />
                      {address.city}, {address.postalCode}
                      <br />
                      {address.country}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Amount Summary */}
            <div className="detail-card">
              <h2>{ t('orderDetail.amountSummary')}</h2>
              <div className="amount-summary">
                <div className="amount-row">
                  <span>{ t('orderDetail.subtotal')}</span>
                  <span>${order.total_amount ? (typeof order.total_amount === 'string' ? parseFloat(order.total_amount).toFixed(2) : order.total_amount.toFixed(2)) : '0.00'}</span>
                </div>
                <div className="amount-divider"></div>
                <div className="amount-row total">
                  <span>{ t('orderDetail.total')}</span>
                  <span>${order.total_amount ? (typeof order.total_amount === 'string' ? parseFloat(order.total_amount).toFixed(2) : order.total_amount.toFixed(2)) : '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
