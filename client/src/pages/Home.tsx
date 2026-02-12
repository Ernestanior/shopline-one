import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { apiFetch } from '../lib/api';
import './Home.css';

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

interface Category {
  id: string;
  name: string;
  description: string;
}

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoOk, setVideoOk] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [videoSrc, setVideoSrc] = useState('/videos/hero-commerce.mp4');
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  const fallbackVideoSrc = '/videos/mega-menu-preview.mp4';

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    if (typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          apiFetch<Product[]>('/api/products'),
          apiFetch<Category[]>('/api/categories')
        ]);

        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (!videoOk) return;
    const el = heroVideoRef.current;
    if (!el) return;

    let mounted = true;
    const ensurePaused = () => {
      try {
        el.pause();
      } catch {
        // ignore
      }
    };

    const ensurePlaying = async () => {
      try {
        await el.play();
      } catch {
        if (mounted) setVideoOk(false);
      }
    };

    if (typeof window.IntersectionObserver !== 'function') {
      void ensurePlaying();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          void ensurePlaying();
        } else {
          ensurePaused();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, [prefersReducedMotion, videoOk]);

  const featuredProducts = products.filter(product => product.featured);

  if (loading) {
    return (
      <div className="home">
        <section
          className="hero"
          style={{ backgroundImage: "linear-gradient(135deg, rgba(245, 245, 245, 0.92) 0%, rgba(232, 232, 232, 0.92) 100%), url('/images/burst/hero-minimal-workspace.jpg')" }}
        >
          <div className="container hero-container">
            <div className="hero-grid">
              <div className="hero-copy" aria-hidden="true">
                <div className="home-skeleton home-skeleton--pill home-skeleton--w-220" />
                <div className="home-skeleton home-skeleton--title home-skeleton--w-360 home-skeleton--mt-18" />
                <div className="home-skeleton home-skeleton--text home-skeleton--w-520 home-skeleton--mt-16" />
                <div className="home-skeleton home-skeleton--text home-skeleton--w-480 home-skeleton--mt-10" />
                <div className="hero-cta" style={{ marginTop: 26 }}>
                  <div className="home-skeleton home-skeleton--btn home-skeleton--w-190" />
                  <div className="home-skeleton home-skeleton--btn home-skeleton--w-160" />
                </div>
                <div className="hero-trust" style={{ marginTop: 26 }}>
                  <div className="home-skeleton home-skeleton--card" />
                  <div className="home-skeleton home-skeleton--card" />
                  <div className="home-skeleton home-skeleton--card" />
                </div>
              </div>

              <div className="hero-media" aria-hidden="true">
                <div className="hero-video">
                  <div className="hero-video__frame">
                    <div className="hero-video__placeholder" />
                    <div className="hero-video__badge">Film preview</div>
                    <div className="hero-video__overlay" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="brand-strip" aria-hidden="true">
          <div className="container">
            <div className="brand-strip-inner">
              <div className="home-skeleton home-skeleton--brand" />
              <div className="home-skeleton home-skeleton--brand" />
              <div className="home-skeleton home-skeleton--brand" />
              <div className="home-skeleton home-skeleton--brand" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Hero Section */}
      <section
        className="hero"
        style={{ backgroundImage: "linear-gradient(135deg, rgba(245, 245, 245, 0.92) 0%, rgba(232, 232, 232, 0.92) 100%), url('/images/burst/hero-minimal-workspace.jpg')" }}
      >
        <div className="container hero-container">
          <div className="hero-grid">
            <Reveal className="hero-copy">
              <div className="hero-kicker">Designed for daily rituals</div>
              <h1>XYVN</h1>
              <p>
                Minimal tools that turn routine moments into calm, tactile experiences—built for focus, carry, and home.
              </p>

              <div className="hero-cta">
                <Link to="/collections/productivity" className="btn-primary">
                  Shop Productivity
                </Link>
                <Link to="/collections/mobility" className="btn-secondary">
                  Explore Carry
                </Link>
              </div>

              <div className="hero-trust">
                <div className="trust-item">
                  <div className="trust-icon">🚚</div>
                  <div className="trust-content">
                    <div className="trust-value">2–3 days</div>
                    <div className="trust-label">Domestic shipping</div>
                  </div>
                </div>
                <div className="trust-item">
                  <div className="trust-icon">↩️</div>
                  <div className="trust-content">
                    <div className="trust-value">30 days</div>
                    <div className="trust-label">Easy returns</div>
                  </div>
                </div>
                <div className="trust-item">
                  <div className="trust-icon">🔒</div>
                  <div className="trust-content">
                    <div className="trust-value">Secure</div>
                    <div className="trust-label">Checkout & privacy</div>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal className="hero-media" delayMs={80}>
              {prefersReducedMotion || !videoOk ? (
                <>
                  <div className="hero-media-card">
                    <img 
                      src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80" 
                      alt="Workspace essentials"
                      loading="eager"
                    />
                  </div>
                  <div className="hero-media-card hero-media-card--secondary">
                    <img 
                      src="https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&q=80" 
                      alt="Carry essentials"
                      loading="eager"
                    />
                  </div>
                </>
              ) : (
                <div className="hero-video">
                  <div className="hero-video__frame">
                    {!videoReady && (
                      <div className="hero-video__placeholder" aria-hidden="true" />
                    )}
                    <video
                      className={`hero-video__media ${videoReady ? 'is-ready' : ''}`}
                      ref={heroVideoRef}
                      src={videoSrc}
                      poster="/images/burst/hero-minimal-workspace.jpg"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      onLoadedData={() => setVideoReady(true)}
                      onError={() => {
                        if (videoSrc !== fallbackVideoSrc) {
                          setVideoReady(false);
                          setVideoSrc(fallbackVideoSrc);
                          return;
                        }
                        setVideoOk(false);
                      }}
                    />
                    <div className="hero-video__overlay" aria-hidden="true" />
                    <div className="hero-video__grain" aria-hidden="true" />
                  </div>
                </div>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      <section className="brand-strip">
        <div className="container">
          <Reveal>
            <div className="brand-strip-inner" aria-label="Featured in">
              <span className="brand-item">Design Notes</span>
              <span className="brand-dot" aria-hidden="true">•</span>
              <span className="brand-item">Minimalist Weekly</span>
              <span className="brand-dot" aria-hidden="true">•</span>
              <span className="brand-item">Carry Journal</span>
              <span className="brand-dot" aria-hidden="true">•</span>
              <span className="brand-item">Home & Calm</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Featured Collections Showcase */}
      <section className="featured-collections">
        <div className="container" >
          <Reveal>
            <div className="section-header">
              <h2>Explore Collections</h2>
              <p className="section-subtitle">Curated tools for every aspect of your daily life</p>
            </div>
          </Reveal>

          <div className="collections-showcase">
            {categories.slice(0, 3).map((category, idx) => (
              <Reveal key={category.id} delayMs={60 * idx}>
                <Link to={`/collections/${category.id}`} className="showcase-card">
                  <div className="showcase-card__image">
                    <img
                      src={
                        category.id === 'productivity'
                          ? 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80'
                          : category.id === 'mobility'
                            ? 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80'
                            : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80'
                      }
                      alt={category.name}
                      loading="lazy"
                    />
                  </div>
                  <div className="showcase-card__content">
                    <h3>{category.name}</h3>
                    <p>{category.description}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="categories">
        <div className="container">
          <Reveal>
            <div className="section-header">
              <h2>All Categories</h2>
              <p className="section-subtitle">Find exactly what you need</p>
            </div>
          </Reveal>
          <div className="category-grid">
            {categories.map((category, idx) => (
              <Reveal key={category.id} delayMs={60 * idx}>
                <Link to={`/collections/${category.id}`} className="category-card">
                  <div className="category-image">
                    <img
                      src={
                        category.id === 'productivity'
                          ? 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80'
                          : category.id === 'mobility'
                            ? 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80'
                            : category.id === 'sanctuary'
                              ? 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80'
                              : 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80'
                      }
                      alt={category.name}
                      loading="lazy"
                    />
                  </div>
                  <div className="category-content">
                    <h3>{category.name}</h3>
                    <p>{category.description}</p>
                    <span className="category-cta">Shop Now →</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <div className="container">
          <Reveal>
            <div className="section-header">
              <h2>Featured Products</h2>
              <p className="section-subtitle">Handpicked essentials for your everyday</p>
            </div>
          </Reveal>
          <div className="products-grid">
            {featuredProducts.slice(0, 6).map((product, idx) => (
              <Reveal key={product.id} delayMs={50 * idx}>
                <Link to={`/product/${product.id}`} className="product-card product-card--link" aria-label={`View ${product.name}`}>
                  <div className="product-image">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                      }}
                    />
                    {product.status === 'coming-soon' && (
                      <div className="coming-soon-badge">Coming Soon</div>
                    )}
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="product-footer">
                      <span className="price">${product.price}</span>
                      {product.status === 'available' ? (
                        <span className="btn-view-details">View Details</span>
                      ) : (
                        <span className="coming-soon-text">Coming Soon</span>
                      )}
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="value-props">
        <div className="container">
          <Reveal>
            <h2>Built for the details</h2>
            <p className="section-subtitle">Premium materials, quiet design, and thoughtful utility—without the noise.</p>
          </Reveal>

          <div className="value-grid">
            <Reveal delayMs={60}>
              <div className="value-card">
                <div className="value-icon">✨</div>
                <div className="value-title">Material-first</div>
                <div className="value-text">Clean finishes, durable builds, and a tactile feel you'll notice every day.</div>
              </div>
            </Reveal>
            <Reveal delayMs={120}>
              <div className="value-card">
                <div className="value-icon">🎒</div>
                <div className="value-title">Made to carry</div>
                <div className="value-text">Slim profiles and purposeful form factors—easy to take, easy to keep.</div>
              </div>
            </Reveal>
            <Reveal delayMs={180}>
              <div className="value-card">
                <div className="value-icon">♾️</div>
                <div className="value-title">Designed to last</div>
                <div className="value-text">Timeless aesthetics with long-term usability. Less clutter, more calm.</div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="testimonials">
        <div className="container">
          <Reveal>
            <h2>What customers say</h2>
            <p className="section-subtitle">A few notes from people who value calm, function, and craft.</p>
          </Reveal>

          <div className="testimonial-grid">
            <Reveal delayMs={60}>
              <div className="testimonial-card">
                <div className="testimonial-stars">★★★★★</div>
                <div className="testimonial-quote">“The finish is unreal. It’s the kind of tool you want to keep on your desk.”</div>
                <div className="testimonial-meta">
                  <div className="testimonial-avatar">AL</div>
                  <div>
                    <div className="testimonial-name">A. Lin</div>
                    <div className="testimonial-role">Productivity</div>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal delayMs={120}>
              <div className="testimonial-card">
                <div className="testimonial-stars">★★★★★</div>
                <div className="testimonial-quote">“Minimal but not boring. Everything feels considered.”</div>
                <div className="testimonial-meta">
                  <div className="testimonial-avatar">YC</div>
                  <div>
                    <div className="testimonial-name">Y. Chen</div>
                    <div className="testimonial-role">Home & Lifestyle</div>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal delayMs={180}>
              <div className="testimonial-card">
                <div className="testimonial-stars">★★★★★</div>
                <div className="testimonial-quote">“Fits perfectly in my everyday carry. Quality is better than expected.”</div>
                <div className="testimonial-meta">
                  <div className="testimonial-avatar">SW</div>
                  <div>
                    <div className="testimonial-name">S. Wu</div>
                    <div className="testimonial-role">Mobility</div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
