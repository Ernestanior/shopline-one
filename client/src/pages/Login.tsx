import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const { login } = useAuth();
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
      
      // 检查用户是否是管理员
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.is_admin) {
          // 管理员跳转到管理后台
          navigate('/admin', { replace: true });
          return;
        }
      }
      
      // 普通用户跳转到原来的页面或首页
      navigate(from || '/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('network error');
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
          <h1>Login</h1>
          <p className="login-subtitle">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
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
              <label htmlFor="password">Password</label>
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
              {isSubmitting ? 'Signing In…' : 'Sign In'}
            </button>
          </form>

          <div className="login-links">
            <Link to="/contact">Need help?</Link>
            <Link to="/collections/productivity">Continue shopping</Link>
          </div>

          <div className="login-note">
            <p>Sign in to continue.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
