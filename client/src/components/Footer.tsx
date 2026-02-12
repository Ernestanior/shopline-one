import React from 'react';
import './Footer.css';
import { apiFetch } from '../lib/api';

const Footer: React.FC = () => {
  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector('input') as HTMLInputElement;
    const button = form.querySelector('button') as HTMLButtonElement;
    
    if (input && button) {
      const email = input.value;
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Subscribing...';
      
      try {
        await apiFetch('/api/newsletter/subscribe', {
          method: 'POST',
          json: { email }
        });
        
        button.textContent = '✓ Subscribed!';
        button.style.background = '#10b981';
        input.value = '';
        
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '';
          button.disabled = false;
        }, 3000);
      } catch (error) {
        button.textContent = '✗ Failed';
        button.style.background = '#ef4444';
        
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '';
          button.disabled = false;
        }, 3000);
      }
    }
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Stay in the loop with our newsletter</h3>
          <form className="newsletter" onSubmit={handleNewsletterSubmit}>
            <input type="email" placeholder="Enter your email" required />
            <button type="submit">Subscribe</button>
          </form>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h4>Shop</h4>
            <ul>
              <li><a href="/collections/mobility">Mobility</a></li>
              <li><a href="/collections/productivity">Productivity</a></li>
              <li><a href="/collections/sanctuary">Sanctuary</a></li>
              <li><a href="/collections/savoriness">Savoriness</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Help</h4>
            <ul>
              <li><a href="/about">About Us</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/policies">Policies</a></li>
              <li><a href="/manual">Online Manual</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Follow Us</h4>
            <div className="social-links">
              <a href="https://www.facebook.com/xyvn" target="_blank" rel="noopener noreferrer">Facebook (XYVN)</a>
              <a href="https://x.com/xyvn" target="_blank" rel="noopener noreferrer">X (XYVN)</a>
              <a href="https://www.instagram.com/xyvn/" target="_blank" rel="noopener noreferrer">Instagram (XYVN)</a>
              <a href="https://www.youtube.com/@XYVN" target="_blank" rel="noopener noreferrer">YouTube (XYVN)</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="payment-methods">
            <span>Payment methods:</span>
            <div className="payment-icons">
              <span>American Express</span>
              <span>Apple Pay</span>
              <span>Diners Club</span>
              <span>Discover</span>
              <span>Google Pay</span>
              <span>JCB</span>
              <span>Mastercard</span>
              <span>PayPal</span>
              <span>Visa</span>
            </div>
          </div>
          
          <div className="legal-links">
            <a href="/policies/privacy-policy">Privacy policy</a>
            <a href="/policies/terms-of-service">Terms of service</a>
            <a href="/policies/refund-policy">Refund policy</a>
          </div>
          
          <p className="powered-by">Powered by Shopify Clone</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
