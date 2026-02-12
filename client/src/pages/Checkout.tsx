import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../lib/api';
import Reveal from '../components/Reveal';
import './Checkout.css';

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type ContactInfo = {
  email: string;
  phone: string;
};

type ShippingAddress = {
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  address1: string;
  address2: string;
  postalCode: string;
};

type CardInfo = {
  cardNumber: string;
  nameOnCard: string;
  expiry: string;
  cvc: string;
};

type SavedPaymentMethod = {
  id: number;
  card_type: string;
  card_last4: string;
  card_holder_name: string;
  expiry_month: string;
  expiry_year: string;
  is_default: number;
};

const STEPS = ['Information', 'Shipping', 'Review', 'Payment'] as const;

type Step = (typeof STEPS)[number];

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem('cart') || '[]';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatMoney(n: number | string) {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return `$${num.toFixed(2)}`;
}

function onlyDigits(input: string) {
  return input.replace(/\D+/g, '');
}

function formatCardNumberInput(raw: string) {
  const digits = onlyDigits(raw).slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiryInput(raw: string) {
  const digits = onlyDigits(raw).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidExpiry(expiry: string) {
  const m = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const mm = Number(m[1]);
  const yy = Number(m[2]);
  if (Number.isNaN(mm) || Number.isNaN(yy)) return false;
  if (mm < 1 || mm > 12) return false;
  return true;
}

type LastOrder = {
  id: string;
  orderId: number | null; // Database ID for API calls
  createdAt: string;
  items: CartItem[];
  contact: ContactInfo;
  address: ShippingAddress;
  totals: { subtotal: number; shipping: number; estimatedTax: number; total: number };
};

function readLastOrder(): LastOrder | null {
  try {
    const raw = localStorage.getItem('last_order');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!('id' in parsed)) return null;
    return parsed as LastOrder;
  } catch {
    return null;
  }
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const step: Step = STEPS[stepIndex] || 'Information';

  const [cartItems, setCartItems] = useState<CartItem[]>(() => readCart());
  const [orderError, setOrderError] = useState<string>('');

  const [contact, setContact] = useState<ContactInfo>({ email: '', phone: '' });
  const [address, setAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    country: 'Taiwan',
    city: '',
    address1: '',
    address2: '',
    postalCode: ''
  });
  const [card, setCard] = useState<CardInfo>({
    cardNumber: '',
    nameOnCard: '',
    expiry: '',
    cvc: ''
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(() => readLastOrder());
  const [hasLoadedUserData, setHasLoadedUserData] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [useNewCard, setUseNewCard] = useState(false);

  // Autofill user data when logged in
  useEffect(() => {
    if (user && !hasLoadedUserData) {
      loadUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Intentionally excluding hasLoadedUserData and loadUserData to prevent infinite loop

  const loadUserData = async () => {
    if (hasLoadedUserData) return; // Prevent multiple loads
    
    try {
      // Set email from user
      setContact(prev => ({ ...prev, email: user?.email || '' }));

      // Fetch and autofill default address
      const addressData = await apiFetch<{ addresses: Array<{
        id: number;
        first_name: string;
        last_name: string;
        phone: string;
        country: string;
        city: string;
        address1: string;
        address2: string;
        postal_code: string;
        is_default: number;
      }> }>('/api/user/addresses');

      const defaultAddr = addressData.addresses?.find(a => a.is_default);
      if (defaultAddr) {
        setAddress({
          firstName: defaultAddr.first_name,
          lastName: defaultAddr.last_name,
          country: defaultAddr.country,
          city: defaultAddr.city,
          address1: defaultAddr.address1,
          address2: defaultAddr.address2 || '',
          postalCode: defaultAddr.postal_code
        });
        setContact(prev => ({ ...prev, phone: defaultAddr.phone || '' }));
      }

      // Fetch saved payment methods
      const paymentData = await apiFetch<{ payment_methods: SavedPaymentMethod[] }>('/api/user/payment-methods');
      
      if (paymentData.payment_methods && paymentData.payment_methods.length > 0) {
        setSavedPaymentMethods(paymentData.payment_methods);
        
        // Select default payment method
        const defaultMethod = paymentData.payment_methods.find(m => m.is_default);
        if (defaultMethod) {
          setSelectedPaymentId(defaultMethod.id);
        } else {
          setSelectedPaymentId(paymentData.payment_methods[0].id);
        }
      } else {
        // No saved payment methods, use new card form
        setUseNewCard(true);
      }

      setHasLoadedUserData(true);
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Continue with empty form if loading fails
      setHasLoadedUserData(true);
      setUseNewCard(true);
    }
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  }, [cartItems]);

  const shipping = useMemo(() => {
    if (subtotal <= 0) return 0;
    return subtotal >= 50 ? 0 : 6.99;
  }, [subtotal]);

  const estimatedTax = 0;

  const total = subtotal + shipping + estimatedTax;

  const totalItems = useMemo(() => cartItems.reduce((sum, it) => sum + it.quantity, 0), [cartItems]);

  const cardDigits = useMemo(() => onlyDigits(card.cardNumber), [card.cardNumber]);
  const cvcDigits = useMemo(() => onlyDigits(card.cvc), [card.cvc]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!contact.email.trim()) e.email = 'Email is required';
    else if (!isValidEmail(contact.email)) e.email = 'Enter a valid email';

    if (!address.firstName.trim()) e.firstName = 'First name is required';
    if (!address.lastName.trim()) e.lastName = 'Last name is required';
    if (!address.city.trim()) e.city = 'City is required';
    if (!address.address1.trim()) e.address1 = 'Address is required';
    if (!address.postalCode.trim()) e.postalCode = 'Postal code is required';

    // Only validate card if using new card
    if (useNewCard || savedPaymentMethods.length === 0) {
      if (!cardDigits) e.cardNumber = 'Card number is required';
      else if (cardDigits.length < 12) e.cardNumber = 'Card number looks too short';

      if (!card.nameOnCard.trim()) e.nameOnCard = 'Name on card is required';

      if (!card.expiry.trim()) e.expiry = 'Expiry is required';
      else if (!isValidExpiry(card.expiry)) e.expiry = 'Use MM/YY';

      if (!cvcDigits) e.cvc = 'CVC is required';
      else if (cvcDigits.length < 3) e.cvc = 'CVC looks too short';
      else if (cvcDigits.length > 4) e.cvc = 'CVC is invalid';
    }

    return e;
  }, [address, card.expiry, card.nameOnCard, cardDigits, contact.email, cvcDigits, useNewCard, savedPaymentMethods.length]);

  const canGoNext = useMemo(() => {
    if (cartItems.length === 0) return false;

    if (step === 'Information') {
      return !errors.email;
    }

    if (step === 'Shipping') {
      return !(
        errors.firstName ||
        errors.lastName ||
        errors.city ||
        errors.address1 ||
        errors.postalCode
      );
    }

    if (step === 'Review') {
      return !(errors.cardNumber || errors.nameOnCard || errors.expiry || errors.cvc) || 
             (!useNewCard && selectedPaymentId !== null);
    }

    return false;
  }, [cartItems.length, step, errors, useNewCard, selectedPaymentId]);

  const nextLabel = step === 'Review' ? 'Place order' : 'Continue';

  const handleNext = async () => {
    if (!canGoNext) return;

    if (step === 'Review') {
      try {
        // Save address and payment info if user is logged in
        if (user) {
          try {
            // Check if address already exists
            const addressData = await apiFetch<{ addresses: Array<{ id: number; address1: string; is_default: number }> }>('/api/user/addresses');
            const existingAddress = addressData.addresses?.find(a => a.address1 === address.address1);
            
            if (!existingAddress) {
              // Save new address as default
              await apiFetch('/api/user/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  label: 'default',
                  first_name: address.firstName,
                  last_name: address.lastName,
                  phone: contact.phone,
                  country: address.country,
                  city: address.city,
                  address1: address.address1,
                  address2: address.address2,
                  postal_code: address.postalCode,
                  is_default: 1
                })
              });
            }

            // Save payment method if it's not masked (not from autofill)
            if (useNewCard && !card.cardNumber.includes('•') && cardDigits.length >= 12) {
              const paymentData = await apiFetch<{ payment_methods: Array<{ id: number; card_last4: string }> }>('/api/user/payment-methods');
              const last4 = cardDigits.slice(-4);
              const existingCard = paymentData.payment_methods?.find(m => m.card_last4 === last4);
              
              if (!existingCard) {
                const [mm, yy] = card.expiry.split('/');
                await apiFetch('/api/user/payment-methods', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    card_type: 'visa',
                    card_last4: last4,
                    card_holder_name: card.nameOnCard,
                    expiry_month: mm,
                    expiry_year: `20${yy}`,
                    is_default: 1
                  })
                });
              }
            }
          } catch (saveError) {
            console.error('Failed to save user data:', saveError);
            // Continue with order creation even if save fails
          }
        }

        // Create order via API
        const result = await apiFetch<{ success: boolean; order: { id: number; orderNumber: string; totalAmount: number; status: string } }>('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: cartItems,
            contact,
            address,
            totals: { subtotal, shipping, estimatedTax, total }
          })
        });

        const orderId = result.order?.id || null; // Database ID
        const orderNumber = result.order?.orderNumber || `XYVN-${Date.now()}`;

        const payload: LastOrder = {
          id: orderNumber,
          orderId: orderId,
          createdAt: new Date().toISOString(),
          items: cartItems,
          contact,
          address,
          totals: { subtotal, shipping, estimatedTax, total }
        };

        try {
          localStorage.setItem('last_order', JSON.stringify(payload));
        } catch {
          // ignore
        }

        setLastOrder(payload);

        try {
          localStorage.setItem('cart', '[]');
          window.dispatchEvent(new Event('storage'));
        } catch {
          // ignore
        }

        setCartItems([]);
        setStepIndex(3);
      } catch (error) {
        console.error('Order creation error:', error);
        setOrderError('Failed to create order. Please try again.');
        setTimeout(() => setOrderError(''), 5000);
      }
      return;
    }

    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const isPaymentStep = step === 'Payment';

  return (
    <div className="checkout">
      <div className="container">
        {orderError && (
          <div style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            left: '20px',
            maxWidth: '500px',
            margin: '0 auto',
            padding: '16px 24px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            animation: 'slideIn 0.28s ease-out'
          }}>
            {orderError}
          </div>
        )}
        
        <Reveal>
          <div className="checkout-header">
            <div className="checkout-title">
              <h1>Checkout</h1>
              <p className="checkout-steps">
                {STEPS.map((s, idx) => (
                  <span
                    key={s}
                    className={`checkout-step ${idx === stepIndex ? 'is-active' : idx < stepIndex ? 'is-done' : ''}`.trim()}
                  >
                    {idx + 1}. {s}
                  </span>
                ))}
              </p>
            </div>
            <Link to="/cart" className="checkout-backlink">
              ← Back to cart
            </Link>
          </div>
        </Reveal>

        {cartItems.length === 0 && !isPaymentStep ? (
          <Reveal>
            <div className="checkout-empty">
              <h2>Your cart is empty</h2>
              <p>Please add items to your cart before checking out.</p>
              <Link to="/collections/productivity" className="btn-primary">
                Continue shopping
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="checkout-grid">
            <div className="checkout-main">
              {step === 'Information' && (
                <Reveal>
                  <section className="checkout-section">
                    <h2>Contact information</h2>
                    {user && (
                      <div className="autofill-notice">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>已登录为 {user.email}</span>
                      </div>
                    )}
                    <div className="checkout-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="checkout-email">Email *</label>
                          <input
                            id="checkout-email"
                            type="email"
                            value={contact.email}
                            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                            onChange={(e) => setContact((v) => ({ ...v, email: e.target.value }))}
                            placeholder="you@example.com"
                            required
                          />
                          {touched.email && errors.email && <div className="field-error">{errors.email}</div>}
                        </div>
                        <div className="form-group">
                          <label htmlFor="checkout-phone">Phone</label>
                          <input
                            id="checkout-phone"
                            type="tel"
                            value={contact.phone}
                            onChange={(e) => setContact((v) => ({ ...v, phone: e.target.value }))}
                            placeholder="+886"
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </Reveal>
              )}

              {step === 'Shipping' && (
                <Reveal>
                  <section className="checkout-section">
                    <h2>Shipping address</h2>
                    {user && address.address1 && (
                      <div className="autofill-notice">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path>
                          <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"></path>
                        </svg>
                        <span>使用默认地址</span>
                      </div>
                    )}
                    <div className="checkout-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="firstName">First name *</label>
                          <input
                            id="firstName"
                            value={address.firstName}
                            onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                            onChange={(e) => setAddress((v) => ({ ...v, firstName: e.target.value }))}
                            required
                          />
                          {touched.firstName && errors.firstName && <div className="field-error">{errors.firstName}</div>}
                        </div>
                        <div className="form-group">
                          <label htmlFor="lastName">Last name *</label>
                          <input
                            id="lastName"
                            value={address.lastName}
                            onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
                            onChange={(e) => setAddress((v) => ({ ...v, lastName: e.target.value }))}
                            required
                          />
                          {touched.lastName && errors.lastName && <div className="field-error">{errors.lastName}</div>}
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="country">Country/Region *</label>
                          <input
                            id="country"
                            value={address.country}
                            onChange={(e) => setAddress((v) => ({ ...v, country: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="city">City *</label>
                          <input
                            id="city"
                            value={address.city}
                            onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                            onChange={(e) => setAddress((v) => ({ ...v, city: e.target.value }))}
                            required
                          />
                          {touched.city && errors.city && <div className="field-error">{errors.city}</div>}
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="address1">Address *</label>
                        <input
                          id="address1"
                          value={address.address1}
                          onBlur={() => setTouched((t) => ({ ...t, address1: true }))}
                          onChange={(e) => setAddress((v) => ({ ...v, address1: e.target.value }))}
                          placeholder="Street address"
                          required
                        />
                        {touched.address1 && errors.address1 && <div className="field-error">{errors.address1}</div>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="address2">Apartment, suite, etc.</label>
                        <input
                          id="address2"
                          value={address.address2}
                          onChange={(e) => setAddress((v) => ({ ...v, address2: e.target.value }))}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="postalCode">Postal code *</label>
                          <input
                            id="postalCode"
                            value={address.postalCode}
                            onBlur={() => setTouched((t) => ({ ...t, postalCode: true }))}
                            onChange={(e) => setAddress((v) => ({ ...v, postalCode: e.target.value }))}
                            required
                          />
                          {touched.postalCode && errors.postalCode && <div className="field-error">{errors.postalCode}</div>}
                        </div>
                      </div>

                      <div className="checkout-note">
                        Shipping fee will be calculated at checkout. Free shipping over $50.
                      </div>
                    </div>
                  </section>
                </Reveal>
              )}

              {step === 'Review' && (
                <Reveal>
                  <section className="checkout-section">
                    <h2>Payment details</h2>
                    
                    {user && savedPaymentMethods.length > 0 && (
                      <div className="payment-methods-selector">
                        <h3>Select payment method</h3>
                        <div className="saved-payment-methods">
                          {savedPaymentMethods.map((method) => (
                            <label key={method.id} className="payment-method-option">
                              <input
                                type="radio"
                                name="payment-method"
                                checked={selectedPaymentId === method.id && !useNewCard}
                                onChange={() => {
                                  setSelectedPaymentId(method.id);
                                  setUseNewCard(false);
                                }}
                              />
                              <div className="payment-method-card">
                                <div className="payment-method-info">
                                  <span className="card-brand">{method.card_type.toUpperCase()}</span>
                                  <span className="card-number">•••• {method.card_last4}</span>
                                </div>
                                <div className="payment-method-meta">
                                  <span>{method.card_holder_name}</span>
                                  <span>Expires {method.expiry_month}/{String(method.expiry_year).slice(-2)}</span>
                                </div>
                              </div>
                            </label>
                          ))}
                          
                          <label className="payment-method-option">
                            <input
                              type="radio"
                              name="payment-method"
                              checked={useNewCard}
                              onChange={() => setUseNewCard(true)}
                            />
                            <div className="payment-method-card payment-method-new">
                              <span>+ Add new card</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                    {(useNewCard || savedPaymentMethods.length === 0) && (
                      <div className="checkout-form">
                        <div className="form-group">
                          <label htmlFor="cardNumber">Card number</label>
                          <input
                            id="cardNumber"
                            inputMode="numeric"
                            value={card.cardNumber}
                            onBlur={() => setTouched((t) => ({ ...t, cardNumber: true }))}
                            onChange={(e) => setCard((v) => ({ ...v, cardNumber: formatCardNumberInput(e.target.value) }))}
                            placeholder="1234 5678 9012 3456"
                          />
                          {touched.cardNumber && errors.cardNumber && <div className="field-error">{errors.cardNumber}</div>}
                        </div>

                        <div className="form-group">
                          <label htmlFor="nameOnCard">Name on card</label>
                          <input
                            id="nameOnCard"
                            value={card.nameOnCard}
                            onBlur={() => setTouched((t) => ({ ...t, nameOnCard: true }))}
                            onChange={(e) => setCard((v) => ({ ...v, nameOnCard: e.target.value }))}
                            placeholder="Full name"
                          />
                          {touched.nameOnCard && errors.nameOnCard && <div className="field-error">{errors.nameOnCard}</div>}
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="expiry">Expiry</label>
                            <input
                              id="expiry"
                              inputMode="numeric"
                              value={card.expiry}
                              onBlur={() => setTouched((t) => ({ ...t, expiry: true }))}
                              onChange={(e) => setCard((v) => ({ ...v, expiry: formatExpiryInput(e.target.value) }))}
                              placeholder="MM/YY"
                            />
                            {touched.expiry && errors.expiry && <div className="field-error">{errors.expiry}</div>}
                          </div>
                          <div className="form-group">
                            <label htmlFor="cvc">CVC</label>
                            <input
                              id="cvc"
                              inputMode="numeric"
                              value={card.cvc}
                              onBlur={() => setTouched((t) => ({ ...t, cvc: true }))}
                              onChange={(e) => setCard((v) => ({ ...v, cvc: onlyDigits(e.target.value).slice(0, 4) }))}
                              placeholder="123"
                            />
                            {touched.cvc && errors.cvc && <div className="field-error">{errors.cvc}</div>}
                          </div>
                        </div>

                        <div className="checkout-note">
                          This is a demo checkout. Your payment details are not processed.
                        </div>
                      </div>
                    )}

                    <div className="checkout-review">
                      <h3>Review</h3>
                      <div className="checkout-review-grid">
                        <div>
                          <div className="review-label">Contact</div>
                          <div className="review-value">{contact.email || '—'}</div>
                        </div>
                        <div>
                          <div className="review-label">Ship to</div>
                          <div className="review-value">
                            {address.firstName || address.lastName || address.address1 ? (
                              <>
                                {address.firstName} {address.lastName}
                                <br />
                                {address.address1}
                                {address.address2 ? `, ${address.address2}` : ''}
                                <br />
                                {address.city} {address.postalCode}
                                <br />
                                {address.country}
                              </>
                            ) : (
                              '—'
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </Reveal>
              )}

              {step === 'Payment' && (
                <Reveal>
                  <section className="checkout-section">
                    <h2>Payment</h2>
                    <div className="checkout-payment">
                      <div className="checkout-payment-card">
                        <h3>Order placed</h3>
                        <p>Your order has been created. In this demo, payment is disabled, so you cannot complete the transaction.</p>

                        {lastOrder && (
                          <div className="checkout-order-meta">
                            <div className="checkout-order-row">
                              <span className="meta-label">Order</span>
                              <span className="meta-value">{lastOrder.id}</span>
                            </div>
                            <div className="checkout-order-row">
                              <span className="meta-label">Email</span>
                              <span className="meta-value">{lastOrder.contact.email}</span>
                            </div>
                            <div className="checkout-order-row">
                              <span className="meta-label">Ship to</span>
                              <span className="meta-value">
                                {lastOrder.address.firstName} {lastOrder.address.lastName}, {lastOrder.address.address1}
                                {lastOrder.address.address2 ? `, ${lastOrder.address.address2}` : ''}, {lastOrder.address.city}{' '}
                                {lastOrder.address.postalCode}, {lastOrder.address.country}
                              </span>
                            </div>
                            <div className="checkout-order-row">
                              <span className="meta-label">Total</span>
                              <span className="meta-value">{formatMoney(lastOrder.totals.total)}</span>
                            </div>
                          </div>
                        )}

                        {lastOrder && lastOrder.items.length > 0 && (
                          <div className="checkout-order-items">
                            {lastOrder.items.map((it) => (
                              <div key={it.id} className="checkout-order-item">
                                <span className="order-item-name">
                                  {it.name} × {it.quantity}
                                </span>
                                <span className="order-item-price">{formatMoney(it.price * it.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <button 
                          type="button" 
                          className="btn-checkout"
                          onClick={async () => {
                            if (!lastOrder || !lastOrder.orderId) {
                              alert('订单信息不完整');
                              return;
                            }

                            try {
                              // Update payment status if user is logged in
                              if (user) {
                                await apiFetch(`/api/user/orders/${lastOrder.orderId}/payment`, {
                                  method: 'PATCH'
                                });
                              }
                              
                              // Navigate to home
                              navigate('/', { replace: true });
                            } catch (error) {
                              console.error('Payment update failed:', error);
                              // Still navigate even if payment update fails (for demo purposes)
                              navigate('/', { replace: true });
                            }
                          }}
                        >
                          Pay now
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => navigate('/', { replace: true })}>
                          Return to home
                        </button>
                      </div>
                    </div>
                  </section>
                </Reveal>
              )}

              {!isPaymentStep && (
                <div className="checkout-actions">
                  <button type="button" className="btn-secondary" onClick={handleBack} disabled={stepIndex === 0}>
                    Back
                  </button>
                  <button type="button" className="btn-checkout" onClick={handleNext} disabled={!canGoNext}>
                    {nextLabel}
                  </button>
                </div>
              )}
            </div>

            <aside className="checkout-summary">
              <Reveal>
                <div className="checkout-summary-card">
                  <h3>Order Summary</h3>

                  <div className="checkout-summary-items">
                    {(isPaymentStep && lastOrder ? lastOrder.items : cartItems).map((it) => (
                      <div key={it.id} className="checkout-summary-item">
                        <div className="checkout-summary-thumb">
                          <img 
                            src={it.image} 
                            alt={it.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                            }}
                            loading="lazy"
                          />
                          <span className="checkout-summary-qty">{it.quantity}</span>
                        </div>
                        <div className="checkout-summary-meta">
                          <div className="checkout-summary-name">{it.name}</div>
                          <div className="checkout-summary-sub">{formatMoney(it.price)}</div>
                        </div>
                        <div className="checkout-summary-line">{formatMoney(it.price * it.quantity)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="summary-row">
                    <span>Subtotal ({isPaymentStep && lastOrder ? lastOrder.items.reduce((sum, it) => sum + it.quantity, 0) : totalItems} items)</span>
                    <span>{formatMoney(isPaymentStep && lastOrder ? lastOrder.totals.subtotal : subtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>{(isPaymentStep && lastOrder ? lastOrder.totals.shipping : shipping) === 0 ? 'Free' : formatMoney(isPaymentStep && lastOrder ? lastOrder.totals.shipping : shipping)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Estimated tax</span>
                    <span>{formatMoney(isPaymentStep && lastOrder ? lastOrder.totals.estimatedTax : estimatedTax)}</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>{formatMoney(isPaymentStep && lastOrder ? lastOrder.totals.total : total)}</span>
                  </div>

                  <div className="checkout-microcopy">
                    Taxes and shipping calculated at checkout. Your payment details are encrypted.
                  </div>
                </div>
              </Reveal>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
