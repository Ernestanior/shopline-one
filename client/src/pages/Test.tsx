import React, { useState, useEffect } from 'react';
import './Test.css';

const Test: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('Testing API connection...');
        
        // Test products API
        const productsResponse = await fetch('/api/products');
        console.log('Products response status:', productsResponse.status);
        
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          console.log('Products data:', productsData);
          setData({ products: productsData });
        } else {
          throw new Error(`Products API failed: ${productsResponse.status}`);
        }

        // Test categories API
        const categoriesResponse = await fetch('/api/categories');
        console.log('Categories response status:', categoriesResponse.status);
        
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          console.log('Categories data:', categoriesData);
          setData((prev: any) => ({ ...prev, categories: categoriesData }));
        } else {
          throw new Error(`Categories API failed: ${categoriesResponse.status}`);
        }

        // Test image access
        const imageResponse = await fetch('/images/productivity.jpg');
        console.log('Image response status:', imageResponse.status);
        console.log('Image response headers:', imageResponse.headers);

      } catch (err: any) {
        console.error('API Test Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    };

    testAPI();
  }, []);

  return (
    <div className="test">
      <div className="container">
        <h1>API Connection Test</h1>
        
        {error && (
          <div className="error">
            <h2>❌ Connection Error</h2>
            <p>{error}</p>
          </div>
        )}

        {data && (
          <div className="success">
            <h2>✅ Connection Successful</h2>
            
            <div className="data-section">
              <h3>Products API ({data.products?.length || 0} items)</h3>
              <pre>{JSON.stringify(data.products, null, 2)}</pre>
            </div>

            <div className="data-section">
              <h3>Categories API ({data.categories?.length || 0} items)</h3>
              <pre>{JSON.stringify(data.categories, null, 2)}</pre>
            </div>

            <div className="data-section">
              <h3>Image Test</h3>
              <p>Check browser console for image loading status</p>
            </div>

            <div className="links">
              <h3>Quick Links</h3>
              <a href="/">🏠 Home</a>
              <a href="/collections/ebooks">📦 Products</a>
              <a href="/cart">🛒 Cart</a>
              <a href="/about">ℹ️ About</a>
              <a href="/contact">📧 Contact</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Test;
