import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import './Cart.css';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCart = () => {
      const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(savedCart);
      setLoading(false);
    };

    loadCart();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadCart();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('storage'));
  };

  const removeItem = (id: number) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('storage'));
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getShipping = () => {
    const subtotal = getTotalPrice();
    if (subtotal === 0) return 0;
    return subtotal >= 50 ? 0 : 6.99;
  };

  const getEstimatedTax = () => {
    return 0;
  };

  const getFreeShippingDelta = () => {
    const subtotal = getTotalPrice();
    if (subtotal <= 0) return 0;
    return Math.max(0, 50 - subtotal);
  };

  const getGrandTotal = () => {
    return getTotalPrice() + getShipping() + getEstimatedTax();
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="cart">
      <div className="container">
        <Reveal>
          <div className="cart-header">
            <h1>Shopping Cart</h1>
            <Link to="/" className="continue-shopping">
              ← Continue Shopping
            </Link>
          </div>
        </Reveal>

        {cartItems.length === 0 ? (
          <Reveal>
            <div className="empty-cart">
              <div className="empty-cart-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 2 3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9l-6-7z"></path>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <path d="M9 22V12h6v10"></path>
                </svg>
              </div>
              <h2>Your cart is currently empty</h2>
              <p>Not sure where to start? Check out our beloved products</p>
              <Link to="/collections/productivity" className="btn-shop-now">
                Start Shopping
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              {cartItems.map((item, idx) => (
                <Reveal key={item.id} delayMs={60 * idx}>
                  <div className="cart-item">
                    <div className="item-image">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                        }}
                        loading="lazy"
                      />
                    </div>
                    
                    <div className="item-details">
                      <h3>{item.name}</h3>
                      <p className="item-price">${item.price}</p>
                    </div>

                    <div className="item-quantity">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="quantity-btn"
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="quantity-btn"
                      >
                        +
                      </button>
                    </div>

                    <div className="item-total">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>

                    <button 
                      onClick={() => removeItem(item.id)}
                      className="remove-btn"
                      aria-label="Remove item"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal>
              <div className="cart-summary">
                <div className="summary-content">
                  <h3>Order Summary</h3>
                  
                  <div className="summary-row">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                  
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>{getShipping() === 0 ? 'Free' : `$${getShipping().toFixed(2)}`}</span>
                  </div>

                  <div className="summary-row">
                    <span>Estimated tax</span>
                    <span>${getEstimatedTax().toFixed(2)}</span>
                  </div>

                  <div className="summary-divider" />

                  {getFreeShippingDelta() > 0 && (
                    <div className="summary-hint">
                      Add <strong>${getFreeShippingDelta().toFixed(2)}</strong> more for free shipping.
                    </div>
                  )}
                  
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>${getGrandTotal().toFixed(2)}</span>
                  </div>

                  <Link to="/checkout" className="btn-checkout">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      <path d="M9 12l2 2 4-4"></path>
                    </svg>
                    Secure checkout
                  </Link>

                  <div className="checkout-microcopy">
                    Taxes and shipping calculated at checkout. Your payment details are encrypted.
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {/* Recommendations */}
        {cartItems.length > 0 && (
          <Reveal>
            <div className="recommendations">
              <h3>You might also like</h3>
              <div className="recommendation-grid">
                <Reveal delayMs={0}>
                  <div className="recommendation-card">
                    <div className="rec-image">
                      <img 
                        src="/images/burst-products/p9-wrist-watches.jpg" 
                        alt="XYVN 3 Series"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                        }}
                        loading="lazy"
                      />
                    </div>
                    <h4>XYVN 3 Series</h4>
                    <p>$89.99</p>
                    <button className="btn-add-to-cart">Add to Cart</button>
                  </div>
                </Reveal>
                
                <Reveal delayMs={80}>
                  <div className="recommendation-card">
                    <div className="rec-image">
                      <img 
                        src="/images/burst-products/p1-wireless-headphones.jpg" 
                        alt="Tool Card"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                        }}
                        loading="lazy"
                      />
                    </div>
                    <h4>Tool Card</h4>
                    <p>$39.99</p>
                    <button className="btn-add-to-cart">Add to Cart</button>
                  </div>
                </Reveal>
                
                <Reveal delayMs={160}>
                  <div className="recommendation-card">
                    <div className="rec-image">
                      <img 
                        src="/images/burst-products/p2-black-earbuds.jpg" 
                        alt="CoinSlide"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                        }}
                        loading="lazy"
                      />
                    </div>
                    <h4>CoinSlide</h4>
                    <p>$49.99</p>
                    <button className="btn-add-to-cart">Add to Cart</button>
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
};

export default Cart;
