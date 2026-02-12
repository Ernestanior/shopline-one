import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import './Register.css';

const Register: React.FC = () => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from as string | undefined;

  const validationError = useMemo(() => {
    if (!email.trim()) return 'Email is required';
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (confirmPassword !== password) return 'Passwords do not match';
    return null;
  }, [email, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password);
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
      className="register"
      style={{ backgroundImage: "linear-gradient(135deg, rgba(245, 245, 245, 0.92) 0%, rgba(232, 232, 232, 0.92) 100%), url('/images/burst/hero-minimal-workspace.jpg')" }}
    >
      <div className="container">
        <div className="register-card">
          <h1>Create account</h1>
          <p className="register-subtitle">Sign up to save your favorites and checkout faster</p>

          <form onSubmit={handleSubmit} className="register-form">
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
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            {error && <div className="register-error">{error}</div>}

            <button type="submit" className="btn-register" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <div className="register-links">
            <Link to="/login">Already have an account?</Link>
            <Link to="/collections/productivity">Continue shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
