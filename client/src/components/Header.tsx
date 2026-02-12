import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Search from './Search';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../lib/api';
import './Header.css';

interface Category {
  id: string;
  name: string;
  description: string;
}

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeMega, setActiveMega] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const megaCloseTimerRef = useRef<number | null>(null);
  const location = useLocation();

  const staticLinks = useMemo(
    () => [
      { name: 'About', path: '/about' },
      { name: 'Contact', path: '/contact' }
    ],
    []
  );

  const megaLinks = useMemo(() => {
    return {
      productivity: [
        { name: 'XYVN 3 Series', path: '/collections/productivity' },
        { name: 'The Dual plus', path: '/collections/productivity' },
        { name: 'The Dual', path: '/collections/productivity' },
        { name: 'Cache 3.0', path: '/collections/productivity' }
      ],
      mobility: [
        { name: 'The Wallet', path: '/collections/mobility' },
        { name: 'XYVN 3 Series', path: '/collections/mobility' },
        { name: 'Cache 3.0', path: '/collections/mobility' },
        { name: 'The Dual', path: '/collections/mobility' }
      ],
      sanctuary: [
        { name: 'View all', path: '/collections/sanctuary' }
      ],
      savoriness: [
        { name: 'View all', path: '/collections/savoriness' }
      ]
    } as Record<string, { name: string; path: string }[]>;
  }, []);

  const megaPromos = useMemo(() => {
    return {
      productivity: [
        {
          title: 'XYVN 3 Series',
          path: '/collections/productivity',
          image: '/images/burst/product-flatlay-notebooks.jpg'
        },
        {
          title: 'The Dual',
          path: '/collections/productivity',
          image: '/images/burst/product-laptop-white-desk.jpg'
        }
      ],
      mobility: [
        {
          title: 'XYVN 3 Series',
          path: '/collections/mobility',
          image: '/images/burst/product-laptop-white-desk.jpg'
        },
        {
          title: 'The Wallet',
          path: '/collections/mobility',
          image: '/images/burst/product-coffee-ready-travel.jpg'
        }
      ],
      sanctuary: [
        {
          title: 'Sanctuary',
          path: '/collections/sanctuary',
          image: '/images/burst/product-gold-shelf-plant.jpg'
        },
        {
          title: 'View all',
          path: '/collections/sanctuary',
          image: '/images/burst/hero-minimal-workspace.jpg'
        }
      ],
      savoriness: [
        {
          title: 'Savoriness',
          path: '/collections/savoriness',
          image: '/images/burst/product-coffee-ready-travel.jpg'
        },
        {
          title: 'View all',
          path: '/collections/savoriness',
          image: '/images/burst/hero-working-from-home.jpg'
        }
      ]
    } as Record<string, { title: string; path: string; image: string }[]>;
  }, []);

  const displayedCategories = useMemo(() => {
    if (categories.length > 0) return categories;
    return [
      { id: 'mobility', name: 'Mobility', description: '' },
      { id: 'productivity', name: 'Productivity', description: '' },
      { id: 'sanctuary', name: 'Sanctuary', description: '' },
      { id: 'savoriness', name: 'Savoriness', description: '' }
    ];
  }, [categories]);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.reduce((sum: number, item: any) => sum + item.quantity, 0));
    };

    // Initial load
    updateCartCount();

    // Listen for storage events (cart updates)
    window.addEventListener('storage', updateCartCount);
    
    return () => {
      window.removeEventListener('storage', updateCartCount);
    };
  }, [location]);

  useEffect(() => {
    let cancelled = false;
    const loadCategories = async () => {
      try {
        const data = await apiFetch<Category[]>('/api/categories');
        if (!cancelled) setCategories(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    };
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setActiveMega(null);
  }, [location.pathname]);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const y = window.scrollY;

        // Update isScrolled state
        setIsScrolled(y > 8);

        ticking = false;
      });
    };

    // Initial call
    onScroll();
    
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const cancelMegaClose = () => {
    if (megaCloseTimerRef.current) {
      window.clearTimeout(megaCloseTimerRef.current);
      megaCloseTimerRef.current = null;
    }
  };

  const scheduleMegaClose = () => {
    cancelMegaClose();
    megaCloseTimerRef.current = window.setTimeout(() => {
      setActiveMega(null);
      megaCloseTimerRef.current = null;
    }, 160);
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  return (
    <header className={`header ${isScrolled ? 'is-scrolled' : ''}`.trim()}>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">
            XYVN
          </Link>

          <div
            className={`menu-backdrop ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          />

          <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <div className="nav-links">
              <div className="nav-desktop-wrapper">
                <div className="nav-links-desktop" onMouseLeave={scheduleMegaClose}>
                  {displayedCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className={`nav-item ${activeMega === cat.id ? 'is-active' : ''}`}
                      onMouseEnter={() => {
                        cancelMegaClose();
                        setActiveMega(cat.id);
                      }}
                    >
                      <Link
                        to={`/collections/${cat.id}`}
                        className="nav-link nav-link--pill"
                        onFocus={() => {
                          cancelMegaClose();
                          setActiveMega(cat.id);
                        }}
                      >
                        {cat.name}
                      </Link>
                    </div>
                  ))}

                  {staticLinks.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="nav-link nav-link--header"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                <div
                  className={`mega-menu ${activeMega ? 'active' : ''}`}
                  onMouseEnter={() => {
                    cancelMegaClose();
                    setActiveMega((v) => v);
                  }}
                  onMouseLeave={scheduleMegaClose}
                >
                  {activeMega && (
                    <div className="mega-menu-inner">
                      <div className="mega-menu-layout">
                        <div className="mega-menu-left">
                          <div className="mega-menu-columns">
                            {(megaLinks[activeMega] || []).map((l) => (
                              <Link
                                key={`${activeMega}-${l.name}`}
                                to={l.path}
                                className="mega-menu-link"
                                onClick={() => setActiveMega(null)}
                              >
                                {l.name}
                              </Link>
                            ))}
                          </div>
                          <Link
                            to={`/collections/${activeMega}`}
                            className="mega-menu-viewall"
                            onClick={() => setActiveMega(null)}
                          >
                            View all
                          </Link>
                        </div>

                        <div className="mega-menu-right">
                          <div className="mega-menu-cards">
                            {(megaPromos[activeMega] || []).slice(0, 2).map((card) => (
                              <Link
                                key={`${activeMega}-${card.title}`}
                                to={card.path}
                                className="mega-card"
                                onClick={() => setActiveMega(null)}
                              >
                                <img 
                                  src={card.image} 
                                  alt={card.title}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                                  }}
                                  loading="lazy"
                                />
                                <div className="mega-card__overlay">
                                  <span className="mega-card__title">{card.title}</span>
                                  <span className="mega-card__arrow">→</span>
                                </div>
                              </Link>
                            ))}
                          </div>

                          <div className="mega-menu-video">
                            <video
                              className="mega-menu-video__media"
                              src="/videos/mega-menu-preview.mp4"
                              autoPlay
                              loop
                              muted
                              playsInline
                              preload="metadata"
                            />

                            <div className="mega-menu-video__overlay" aria-hidden="true" />

                            <div className="mega-menu-video__content">
                              <div className="mega-menu-video__eyebrow">Explore</div>
                              <div className="mega-menu-video__title">{displayedCategories.find((c) => c.id === activeMega)?.name}</div>
                              <Link
                                to={`/collections/${activeMega}`}
                                className="mega-menu-video__cta"
                                onClick={() => setActiveMega(null)}
                              >
                                View collection
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="nav-links-mobile">
                {displayedCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/collections/${cat.id}`}
                    className="nav-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
                {staticLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="nav-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="nav-actions">
              <button 
                className="search-btn" 
                aria-label="Search"
                onClick={() => setIsSearchOpen(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>

              {user ? (
                <div className="auth-pill">
                  <Link
                    to="/account"
                    className="auth-pill__email"
                    title={user.email}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {user.email}
                  </Link>
                  <button
                    type="button"
                    className="auth-pill__logout"
                    onClick={async () => {
                      await logout();
                      setIsMenuOpen(false);
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="auth-links">
                  <Link to="/login" className="login-btn" onClick={() => setIsMenuOpen(false)}>
                    Login
                  </Link>
                  <Link to="/register" className="login-btn login-btn--ghost" onClick={() => setIsMenuOpen(false)}>
                    Register
                  </Link>
                </div>
              )}
              
              <Link to="/cart" className="cart-btn" onClick={() => setIsMenuOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 2 3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9l-6-7z"></path>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <path d="M9 22V12h6v10"></path>
                </svg>
                {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </Link>
            </div>
          </div>

          <button 
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>
      
      <Search isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
};

export default Header;
