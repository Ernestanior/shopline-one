import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import './Search.css';

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

interface SearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const Search: React.FC<SearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    setQuery('');
    setResults([]);
    setLoading(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await apiFetch<Product[]>('/api/products');
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      }
    };

    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      return;
    }

    const t = window.setTimeout(() => setIsVisible(false), 220);
    document.body.style.overflow = '';
    return () => window.clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    setLoading(true);
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase())
    );
    
    setResults(filtered);
    setLoading(false);
  }, [query, products]);

  const handleProductClick = (productId: number) => {
    handleClose();
    navigate(`/product/${productId}`);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && results.length > 0) {
      handleProductClick(results[0].id);
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div className={`search-overlay ${isOpen ? 'is-open' : 'is-closing'}`} onClick={handleClose}>
      <div className={`search-modal ${isOpen ? 'is-open' : 'is-closing'}`} onClick={(e) => e.stopPropagation()}>
        <div className="search-header">
          <div className="search-input-container">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="search-input"
              autoFocus
            />
            <button onClick={handleClose} className="search-close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="search-results">
          {loading ? (
            <div className="search-loading">Searching...</div>
          ) : query.trim() === '' ? (
            <div className="search-suggestions">
              <h3>Popular Searches</h3>
              <div className="suggestion-tags">
                <span onClick={() => setQuery('Arvix')}>Arvix</span>
                <span onClick={() => setQuery('Wallet')}>Wallet</span>
                <span onClick={() => setQuery('Productivity')}>Productivity</span>
                <span onClick={() => setQuery('Tool')}>Tool</span>
              </div>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="results-header">
                <span>{results.length} results found</span>
              </div>
              <div className="results-list">
                {results.map(product => (
                  <div
                    key={product.id}
                    className="search-result-item"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <div className="result-image">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                        }}
                        loading="lazy"
                      />
                    </div>
                    <div className="result-info">
                      <h4>{product.name}</h4>
                      <p>{product.description}</p>
                      <div className="result-meta">
                        <span className="result-category">{product.category}</span>
                        <span className="result-price">${product.price}</span>
                        {product.status === 'coming-soon' && (
                          <span className="result-status">Coming Soon</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-results">
              <h3>No results found</h3>
              <p>Try searching with different keywords</p>
              <div className="search-tips">
                <h4>Search tips:</h4>
                <ul>
                  <li>Check your spelling</li>
                  <li>Try more general keywords</li>
                  <li>Browse by categories</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
