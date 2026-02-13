import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { apiFetch } from '../lib/api';
import './ProductCollection.css';

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

const ProductCollection: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleCardHover = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    if (el.dataset.autoScroll === '1') return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const run = () => {
      const rect = el.getBoundingClientRect();
      const safety = 24;
      const overflow = rect.bottom - (window.innerHeight - safety);
      if (overflow > 0) {
        window.scrollBy({
          top: Math.min(overflow + 8, 220),
          left: 0,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
      }
      el.dataset.autoScroll = '1';
      window.setTimeout(() => {
        if (el.isConnected) el.dataset.autoScroll = '0';
      }, 650);
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(run);
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching products for category:', category);
        const [productsData, categoriesData] = await Promise.all([
          apiFetch<Product[]>(`/api/products${category ? `?category=${category}` : ''}`),
          apiFetch<Category[]>('/api/categories')
        ]);

        console.log('Products received:', productsData);
        console.log('Categories received:', categoriesData);
        
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category]);

  const getCurrentCategory = () => {
    return categories.find(cat => cat.id === category);
  };

  const filterProducts = (products: Product[]) => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query)
    );
  };

  const sortProducts = (products: Product[]) => {
    switch (sortBy) {
      case 'price-low':
        return [...products].sort((a, b) => Number(a.price) - Number(b.price));
      case 'price-high':
        return [...products].sort((a, b) => Number(b.price) - Number(a.price));
      case 'name':
        return [...products].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return products;
    }
  };

  const filteredProducts = filterProducts(products);
  const sortedProducts = sortProducts(filteredProducts);
  const currentCategory = getCurrentCategory();

  const headerBg =
    category === 'productivity'
      ? '/images/burst/hero-organized-workspace.jpg'
      : category === 'mobility'
        ? '/images/burst/hero-working-from-home.jpg'
        : '/images/burst/hero-minimal-workspace.jpg';

  useEffect(() => {
    const pageTitle = currentCategory?.name ? `${currentCategory.name} – Arvix` : 'Collections – Arvix';
    document.title = pageTitle;

    const description = currentCategory?.description || '';
    if (!description) return;

    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', description);
    }
  }, [currentCategory?.name, currentCategory?.description]);

  if (loading) {
    return (
      <div className="product-collection">
        <div className="container">
          <div
            className="collection-header collection-header--with-bg"
            style={{ backgroundImage: `url('${headerBg}')` }}
          >
            <div className="collection-header__overlay" />
            <div className="collection-header__content">
              <div className="skeleton skeleton-pill" style={{ width: 240 }} />
              <div className="skeleton skeleton-title" style={{ width: 320, margin: '18px auto 0' }} />
              <div className="skeleton skeleton-text" style={{ width: 520, margin: '14px auto 0' }} />
            </div>
          </div>

          <div className="collection-controls">
            <div className="skeleton skeleton-text" style={{ width: 120 }} />
            <div className="select-wrap select-wrap--skeleton">
              <div className="skeleton skeleton-pill" style={{ width: 190 }} />
            </div>
          </div>

          <div className="products-grid">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={`s-${idx}`} className="product-card product-card--link" aria-hidden="true">
                <div className="product-image">
                  <div className="skeleton skeleton-media" />
                </div>
                <div className="product-info">
                  <div className="skeleton skeleton-title" style={{ width: '68%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '92%', marginTop: 10 }} />
                  <div className="skeleton skeleton-text" style={{ width: '78%', marginTop: 10 }} />
                  <div className="product-footer" style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="skeleton skeleton-pill" style={{ width: 72, height: 18 }} />
                    <div className="skeleton skeleton-pill" style={{ width: 120, height: 34 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-collection">
      <div className="container">
        {/* Header */}
        <Reveal>
          <div
            className="collection-header collection-header--with-bg"
            style={{ backgroundImage: `url('${headerBg}')` }}
          >
            <div className="collection-header__overlay" />
            <div className="collection-header__content">
              <nav className="breadcrumb">
                <Link to="/">Home</Link>
                <span>/</span>
                <span>{currentCategory?.name || 'All Products'}</span>
              </nav>
              
              <h1>{currentCategory?.name || 'All Products'}</h1>
              {currentCategory && (
                <p className="collection-description">{currentCategory.description}</p>
              )}
            </div>
          </div>
        </Reveal>

        {/* Filters and Sort */}
        <Reveal delayMs={80}>
          <div className="collection-controls">
            <div className="results-count">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </div>

            <div className="collection-filters">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="sort-controls">
                <label htmlFor="sort">Sort by:</label>
                <div className="select-wrap">
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Products Grid */}
        {sortedProducts.length > 0 ? (
          <div className="products-grid">
            {sortedProducts.map((product, idx) => (
              <Reveal key={product.id} delayMs={60 * idx}>
                {product.status === 'available' ? (
                  <Link
                    to={`/product/${product.id}`}
                    className="product-card product-card--link"
                    onMouseEnter={(e) => handleCardHover(e.currentTarget)}
                    aria-label={`View ${product.name}`}
                  >
                    <div className="product-image">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                        }}
                      />
                      {product.featured && <div className="featured-badge">Featured</div>}
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <div className="product-expand">
                        <p className="product-description">{product.description}</p>
                      </div>
                      <div className="product-footer">
                        <span className="price">${product.price}</span>
                        <span className="btn-view-details">View Details</span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div
                    className="product-card is-disabled"
                    aria-disabled="true"
                    aria-label={`${product.name} coming soon`}
                  >
                    <div className="product-image">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                        }}
                      />
                      <div className="coming-soon-badge">Coming Soon</div>
                      {product.featured && <div className="featured-badge">Featured</div>}
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <div className="product-expand">
                        <p className="product-description">{product.description}</p>
                      </div>
                      <div className="product-footer">
                        <span className="price">${product.price}</span>
                        <span className="coming-soon-text">Coming Soon</span>
                      </div>
                    </div>
                  </div>
                )}
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="no-products">
            <h2>No products found</h2>
            <p>
              {searchQuery 
                ? `No products match "${searchQuery}". Try a different search term.`
                : 'Check back later for new arrivals in this category.'
              }
            </p>
          </div>
        )}

        {/* Category Navigation */}
        <Reveal>
          <div className="category-nav">
            <h3>Shop Other Categories</h3>
            <div className="category-links">
              {categories
                .filter((cat) => cat.id !== category)
                .map((cat) => (
                  <Link key={cat.id} to={`/collections/${cat.id}`} className="category-link">
                    {cat.name}
                  </Link>
                ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
};

export default ProductCollection;
