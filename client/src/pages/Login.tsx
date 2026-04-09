import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import './Login.css';

const Login: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from as string | undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      
      // Login successful, navigate based on user role
      // The AuthContext will handle fetching user data
      // We can check the user from context after a brief delay
      setTimeout(() => {
        // Navigate to the original page or home
        navigate(from || '/', { replace: true });
      }, 100);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t('common.error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="login"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(245, 245, 245, 0.92) 0%, rgba(232, 232, 232, 0.92) 100%), url('/images/burst/hero-working-from-home.jpg')" }}
    >
      <div className="container">
        <div className="login-card">
          <h1>{t('login.title')}</h1>
          <p className="login-subtitle">{t('login.subtitle')}</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">{t('auth.email')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('auth.password')}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="btn-login" disabled={isSubmitting}>
              {isSubmitting ? `${t('login.submit')}…` : t('login.submit')}
            </button>
          </form>

          <div className="login-links">
            <Link to="/contact">{t('footer.help')}</Link>
            <Link to="/collections/ebooks">{t('cart.continueShopping')}</Link>
          </div>

          <div className="login-note">
            <p>{t('login.subtitle')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
