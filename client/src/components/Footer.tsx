import React from 'react';
import './Footer.css';
import { apiFetch } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector('input') as HTMLInputElement;
    const button = form.querySelector('button') as HTMLButtonElement;
    
    if (input && button) {
      const email = input.value;
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = t('common.loading');
      
      try {
        await apiFetch('/api/newsletter/subscribe', {
          method: 'POST',
          json: { email }
        });
        
        button.textContent = '✓ ' + t('common.success');
        button.style.background = '#10b981';
        input.value = '';
        
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '';
          button.disabled = false;
        }, 3000);
      } catch (error) {
        button.textContent = '✗ ' + t('common.error');
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
          <h3>{t('footer.newsletter')}</h3>
          <form className="newsletter" onSubmit={handleNewsletterSubmit}>
            <input type="email" placeholder={t('auth.email')} required />
            <button type="submit">{t('footer.subscribe')}</button>
          </form>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h4>{t('nav.products')}</h4>
            <ul>
              <li><a href="/collections/ebooks">{t('footer.category.ebooks')}</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>{t('footer.help')}</h4>
            <ul>
              <li><a href="/about">{t('footer.about')}</a></li>
              <li><a href="/contact">{t('footer.contact')}</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>{t('footer.social')}</h4>
            <div className="social-links">
              <a href="https://www.instagram.com/arvix3114?igsh=eXQ0aDYwaTk3OHVx&utm_source=qr" target="_blank" rel="noopener noreferrer">Instagram (ARVIX)</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="legal-links">
            <a href="/policies/privacy-policy">{t('footer.privacyPolicy')}</a>
            <a href="/policies/terms-of-service">{t('footer.termsOfService')}</a>
            <a href="/policies/refund-policy">{t('footer.refundPolicy')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
