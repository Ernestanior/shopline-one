import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
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
  const { t } = useLanguage();
  
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
      setError(t('common.error'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiFetch<{ order: Order }>(`/api/orders/${orderId}`);
      
      if (!data.order) {
        setError(t('common.error'));
        return;
      }

      // Check if order is already paid
      if (data.order.status === 'paid') {
        setError(t('order.status.paid'));
        return;
      }

      setOrder(data.order);
    } catch (err: any) {
      console.error('Failed to load order:', err);
      setError(err.message || t('common.error'));
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
      setError(t('checkout.selectPayment'));
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
        setError(response.error || t('common.error'));
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
        setError(t('common.error'));
      }
    } catch (err: any) {
      console.error('Payment creation error:', err);
      setError(err.message || t('common.error'));
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
            <p>{t('common.loading')}</p>
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
              <h2>{t('common.error')}</h2>
              <p>{error}</p>
              <Link to="/cart" className="btn-primary">
                {t('checkout.backToCart')}
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
            <h1>{t('checkout.title')}</h1>
            <p className="order-number">{t('account.orderNumber')}: {order.orderNumber}</p>
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
                <h2>{t('checkout.orderSummary')}</h2>
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
                  {t('checkout.backToCart')}
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSubmitPayment}
                  disabled={!selectedGateway || !selectedMethod || processing}
                >
                  {processing ? t('checkout.processing') : t('checkout.proceedToPayment')}
                </button>
              </div>
            </Reveal>
          </div>

          <aside className="checkout-sidebar">
            <Reveal>
              <div className="order-summary">
                <h3>{t('checkout.amountDetails')}</h3>
                <div className="summary-row">
                  <span>{t('cart.subtotal')} ({totalItems} {t('cart.items')})</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-divider" />
                <div className="summary-row total">
                  <span>{t('cart.total')}</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="summary-note">
                  {t('checkout.confirmationNote')}
                </div>
              </div>
            </Reveal>
          </aside>
        </div>
      </div>
    </div>
  );
}
