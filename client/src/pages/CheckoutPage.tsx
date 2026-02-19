import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../lib/api';
import PaymentMethodSelector from '../components/PaymentMethodSelector';
import Reveal from '../components/Reveal';
import './CheckoutPage.css';

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
}

export default function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) {
      setError('订单ID缺失');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiFetch<{ order: Order }>(`/api/orders/${orderId}`);
      
      if (!data.order) {
        setError('订单不存在');
        return;
      }

      // Check if order is already paid
      if (data.order.status === 'paid') {
        setError('此订单已支付');
        return;
      }

      setOrder(data.order);
    } catch (err: any) {
      console.error('Failed to load order:', err);
      setError(err.message || '加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodSelect = (gateway: string, method: string) => {
    setSelectedGateway(gateway);
    setSelectedMethod(method);
  };

  const handleSubmitPayment = async () => {
    if (!order || !selectedGateway || !selectedMethod) {
      setError('请选择支付方式');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const response = await apiFetch<{
        success: boolean;
        formHtml?: string;
        error?: string;
      }>('/api/payment/create', {
        method: 'POST',
        json: {
          orderId: order.id,
          gateway: selectedGateway,
          paymentMethod: selectedMethod
        }
      });

      if (!response.success) {
        setError(response.error || '创建支付失败');
        return;
      }

      if (response.formHtml) {
        // Insert the HTML form into the page and auto-submit
        const container = document.createElement('div');
        container.innerHTML = response.formHtml;
        document.body.appendChild(container);
        
        // The form should auto-submit via the script in the HTML
        // If it doesn't, we can manually submit it
        const form = container.querySelector('form');
        if (form && !form.querySelector('script')) {
          form.submit();
        }
      } else {
        setError('未收到支付表单');
      }
    } catch (err: any) {
      console.error('Payment creation error:', err);
      setError(err.message || '创建支付失败，请稍后重试');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>加载订单信息...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="checkout-page">
        <div className="container">
          <Reveal>
            <div className="error-state">
              <h2>无法加载订单</h2>
              <p>{error}</p>
              <Link to="/cart" className="btn-primary">
                返回购物车
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="checkout-page">
      <div className="container">
        <Reveal>
          <div className="checkout-header">
            <h1>订单支付</h1>
            <p className="order-number">订单编号: {order.orderNumber}</p>
          </div>
        </Reveal>

        {error && (
          <Reveal>
            <div className="error-message">
              {error}
            </div>
          </Reveal>
        )}

        <div className="checkout-grid">
          <div className="checkout-main">
            <Reveal>
              <section className="checkout-section">
                <h2>订单摘要</h2>
                <div className="order-items">
                  {order.items.map((item) => (
                    <div key={item.id} className="order-item">
                      <div className="item-image">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                          }}
                        />
                        <span className="item-quantity">{item.quantity}</span>
                      </div>
                      <div className="item-details">
                        <h4>{item.name}</h4>
                        <p className="item-price">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="item-total">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </Reveal>

            <Reveal>
              <section className="checkout-section">
                <PaymentMethodSelector onSelect={handlePaymentMethodSelect} />
              </section>
            </Reveal>

            <Reveal>
              <div className="checkout-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate('/cart')}
                  disabled={processing}
                >
                  返回购物车
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSubmitPayment}
                  disabled={!selectedGateway || !selectedMethod || processing}
                >
                  {processing ? '处理中...' : '前往支付'}
                </button>
              </div>
            </Reveal>
          </div>

          <aside className="checkout-sidebar">
            <Reveal>
              <div className="order-summary">
                <h3>金额明细</h3>
                <div className="summary-row">
                  <span>小计 ({totalItems} 件商品)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>运费</span>
                  <span>待计算</span>
                </div>
                <div className="summary-divider" />
                <div className="summary-row total">
                  <span>总计</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="summary-note">
                  支付完成后，您将收到订单确认邮件
                </div>
              </div>
            </Reveal>
          </aside>
        </div>
      </div>
    </div>
  );
}
