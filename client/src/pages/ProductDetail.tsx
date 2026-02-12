import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { apiFetch } from '../lib/api';
import './ProductDetail.css';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  status: string;
  featured: boolean;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const products = await apiFetch<Product[]>('/api/products');
        const foundProduct = products.find((p: Product) => p.id === parseInt(id || '0'));
        setProduct(foundProduct || null);
        setActiveImageIndex(0);

        if (foundProduct) {
          const related = products
            .filter((p) => p.category === foundProduct.category && p.id !== foundProduct.id)
            .slice(0, 4);
          setRelatedProducts(related);
        } else {
          setRelatedProducts([]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const addToCart = () => {
    if (!product) return;
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: CartItem) => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
    setToast('Added to cart');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <div className="container">
          <h1>Product Not Found</h1>
          <p>The product you're looking for doesn't exist.</p>
          <Link to="/collections/productivity" className="btn-primary">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail">
      <div className="container">
        <Reveal>
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to={`/collections/${product.category}`}>{product.category}</Link>
            <span>/</span>
            <span>{product.name}</span>
          </nav>
        </Reveal>

        {toast && (
          <div className="toast" role="status" aria-live="polite">
            <span>{toast}</span>
            <div className="toast-actions">
              {product && (
                <Link to={`/collections/${product.category}`} className="toast-link toast-link--ghost">Continue</Link>
              )}
              <Link to="/cart" className="toast-link">View cart</Link>
            </div>
          </div>
        )}

        <div className="product-content">
          <Reveal>
            <div className="product-images">
              {(() => {
                const images = [product.image, product.image, product.image];
                const main = images[activeImageIndex] || product.image;
                return (
                  <>
              <div className="main-image">
                    <img 
                      src={main} 
                      alt={product.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                      }}
                      loading="lazy"
                    />
              </div>
              <div className="image-thumbnails">
                    {images.map((src, idx) => (
                  <button
                    key={`${product.id}-thumb-${idx}`}
                    type="button"
                        className={`thumb ${activeImageIndex === idx ? 'active' : ''}`}
                        onClick={() => setActiveImageIndex(idx)}
                    aria-label={`Select image ${idx + 1}`}
                  >
                    <img 
                      src={src} 
                      alt={product.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                      }}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
                  </>
                );
              })()}
            </div>
          </Reveal>

          <Reveal delayMs={60}>
            <div className="product-info">
              <div className="product-header">
                <h1>{product.name}</h1>
                <div className="product-meta">
                  <span className="category">{product.category}</span>
                  {product.featured && <span className="featured">Featured</span>}
                </div>
              </div>

              <div className="purchase-card">
                <div className="price-section">
                  <span className="price">${product.price}</span>
                  {product.status === 'coming-soon' && (
                    <span className="coming-soon">Coming Soon</span>
                  )}
                </div>

                <div className="purchase-actions">
                  <div className="quantity-stepper" aria-label="Quantity">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={product.status === 'coming-soon' || quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <div className="stepper-value" aria-label="Selected quantity">{quantity}</div>
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                      disabled={product.status === 'coming-soon'}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    className={`btn-add-cart ${product.status === 'coming-soon' ? 'disabled' : ''}`}
                    onClick={addToCart}
                    disabled={product.status === 'coming-soon'}
                  >
                    {product.status === 'coming-soon' ? 'Coming Soon' : 'Add to Cart'}
                  </button>
                </div>

                <div className="purchase-note">
                  <div className="purchase-note__row">
                    <span className="dot" aria-hidden="true" />
                    <span>30-day returns</span>
                  </div>
                  <div className="purchase-note__row">
                    <span className="dot" aria-hidden="true" />
                    <span>2–3 day domestic shipping</span>
                  </div>
                </div>
              </div>

              <div className="description">
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>

              <div className="product-specs">
                <h3>Product Specs</h3>
                <ul>
                  <li>Material: Premium Aluminum</li>
                  <li>Dimensions: Compact and Portable</li>
                  <li>Weight: Ultra-light</li>
                  <li>Compatibility: Universal</li>
                  <li>Warranty: 1 Year International</li>
                </ul>
              </div>

              <div className="product-features">
                <h3>Key Features</h3>
                <div className="features-grid">
                  <div className="feature">
                    <div className="feature-icon">✓</div>
                    <span>Premium Materials</span>
                  </div>
                  <div className="feature">
                    <div className="feature-icon">✓</div>
                    <span>Minimalist Design</span>
                  </div>
                  <div className="feature">
                    <div className="feature-icon">✓</div>
                    <span>Durable Construction</span>
                  </div>
                  <div className="feature">
                    <div className="feature-icon">✓</div>
                    <span>Easy to Use</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal>
          <div className="related-products">
            <h3>You might also like</h3>
            <div className="related-grid">
              {relatedProducts.length > 0 ? (
                relatedProducts.map((p, idx) => (
                  <Reveal key={p.id} delayMs={80 * idx}>
                    <Link to={`/product/${p.id}`} className="related-card">
                      <img 
                        src={p.image} 
                        alt={p.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                        }}
                        loading="lazy"
                      />
                      <h4>{p.name}</h4>
                      <p>${p.price}</p>
                      <span className="btn-view">View</span>
                    </Link>
                  </Reveal>
                ))
              ) : (
                <Reveal>
                  <div className="related-empty">No related products yet.</div>
                </Reveal>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
};

export default ProductDetail;
