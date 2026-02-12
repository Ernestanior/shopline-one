import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';
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
      setError('无法加载订单详情');
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
      pending: '待处理',
      processing: '处理中',
      shipped: '已发货',
      completed: '已完成',
      cancelled: '已取消'
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
          <div className="loading-state">加载中...</div>
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
            <h2>{error || '订单不存在'}</h2>
            <Link to="/account" className="btn-primary">返回我的账户</Link>
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
            ← 返回
          </button>
          <h1>订单详情</h1>
        </div>

        <div className="order-detail-grid">
          <div className="order-detail-main">
            {/* 订单信息 */}
            <div className="detail-card">
              <h2>订单信息</h2>
              <div className="detail-row">
                <span className="detail-label">订单号</span>
                <span className="detail-value">{order.order_number}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">下单时间</span>
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
                <span className="detail-label">订单状态</span>
                <span 
                  className="detail-value status"
                  style={{ color: getStatusColor(order.status) }}
                >
                  {getStatusText(order.status)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">支付状态</span>
                <span className="detail-value">
                  {order.payment_status === 'paid' ? '已支付' : '未支付'}
                </span>
              </div>
              
              {/* 操作按钮 */}
              <div className="order-actions">
                {order.payment_status === 'unpaid' && (
                  <button 
                    className="btn-primary"
                    onClick={async () => {
                      const confirmed = await showConfirm({
                        title: '确认支付',
                        message: '确认支付此订单？',
                        type: 'info',
                        confirmText: '确认支付',
                        cancelText: '取消'
                      });

                      if (confirmed) {
                        try {
                          await apiFetch(`/api/user/orders/${order.id}/payment`, {
                            method: 'PATCH'
                          });
                          showToast({ message: '支付成功！', type: 'success' });
                          setTimeout(() => window.location.reload(), 1000);
                        } catch (error) {
                          showToast({ 
                            message: `支付失败: ${error instanceof Error ? error.message : '请稍后重试'}`, 
                            type: 'error' 
                          });
                        }
                      }
                    }}
                  >
                    立即支付
                  </button>
                )}
                <button 
                  className="btn-delete"
                  onClick={async () => {
                    const confirmed = await showConfirm({
                      title: '删除订单',
                      message: '确定要删除此订单吗？此操作无法撤销。',
                      type: 'danger',
                      confirmText: '删除',
                      cancelText: '取消'
                    });

                    if (confirmed) {
                      try {
                        await apiFetch(`/api/user/orders/${order.id}`, {
                          method: 'DELETE'
                        });
                        showToast({ message: '订单已删除', type: 'success' });
                        setTimeout(() => navigate('/account'), 1000);
                      } catch (error) {
                        showToast({ message: '删除失败，请稍后重试', type: 'error' });
                      }
                    }
                  }}
                >
                  删除订单
                </button>
              </div>
            </div>

            {/* 商品列表 */}
            <div className="detail-card">
              <h2>商品清单</h2>
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
                          <span>数量: {item.quantity}</span>
                          <span>单价: ${item.price ? (typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2)) : '0.00'}</span>
                        </div>
                      </div>
                      <div className="item-total">
                        ${item.subtotal ? (typeof item.subtotal === 'string' ? parseFloat(item.subtotal).toFixed(2) : item.subtotal.toFixed(2)) : '0.00'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-items">暂无商品信息</div>
                )}
              </div>
            </div>
          </div>

          <div className="order-detail-sidebar">
            {/* 收货信息 */}
            <div className="detail-card">
              <h2>收货信息</h2>
              <div className="shipping-info">
                <div className="info-item">
                  <div className="info-label">收货人</div>
                  <div className="info-value">{order.shipping_name}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">联系电话</div>
                  <div className="info-value">{order.shipping_phone || '未提供'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">邮箱</div>
                  <div className="info-value">{order.shipping_email}</div>
                </div>
                {address && (
                  <div className="info-item">
                    <div className="info-label">收货地址</div>
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

            {/* 金额汇总 */}
            <div className="detail-card">
              <h2>金额汇总</h2>
              <div className="amount-summary">
                <div className="amount-row">
                  <span>商品小计</span>
                  <span>${order.total_amount ? (typeof order.total_amount === 'string' ? parseFloat(order.total_amount).toFixed(2) : order.total_amount.toFixed(2)) : '0.00'}</span>
                </div>
                <div className="amount-row">
                  <span>运费</span>
                  <span>$0.00</span>
                </div>
                <div className="amount-divider"></div>
                <div className="amount-row total">
                  <span>订单总额</span>
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
