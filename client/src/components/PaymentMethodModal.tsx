import React, { useState, useEffect } from 'react';
import './PaymentMethodModal.css';

interface PaymentMethod {
  id?: number;
  card_type: string;
  card_number: string;
  card_last4?: string;
  card_holder_name: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  is_default: boolean;
}

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (method: PaymentMethod) => void;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<PaymentMethod>({
    card_type: 'visa',
    card_number: '',
    card_holder_name: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    is_default: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        card_type: 'visa',
        card_number: '',
        card_holder_name: '',
        expiry_month: '',
        expiry_year: '',
        cvv: '',
        is_default: false
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateCardNumber = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    return /^\d{16}$/.test(cleaned);
  };

  const validateCVV = (cvv: string) => {
    return /^\d{3,4}$/.test(cvv);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};

    if (!validateCardNumber(formData.card_number)) {
      newErrors.card_number = '请输入有效的16位卡号';
    }

    if (!validateCVV(formData.cvv)) {
      newErrors.cvv = '请输入有效的CVV码（3-4位数字）';
    }

    if (!formData.expiry_month || !formData.expiry_year) {
      newErrors.expiry = '请输入有效期';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue = value;
    
    if (name === 'card_number') {
      processedValue = formatCardNumber(value.replace(/\s/g, '').slice(0, 16));
    } else if (name === 'cvv') {
      processedValue = value.replace(/\D/g, '').slice(0, 4);
    } else if (name === 'expiry_month' || name === 'expiry_year') {
      processedValue = value.replace(/\D/g, '');
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : processedValue
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear + i);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>添加支付方式</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          <div className="form-group">
            <label>卡类型</label>
            <select name="card_type" value={formData.card_type} onChange={handleChange}>
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="amex">American Express</option>
              <option value="jcb">JCB</option>
            </select>
          </div>

          <div className="form-group">
            <label>卡号 *</label>
            <input
              type="text"
              name="card_number"
              value={formData.card_number}
              onChange={handleChange}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required
            />
            {errors.card_number && <span className="error-message">{errors.card_number}</span>}
          </div>

          <div className="form-group">
            <label>持卡人姓名 *</label>
            <input
              type="text"
              name="card_holder_name"
              value={formData.card_holder_name}
              onChange={handleChange}
              placeholder="如卡上所示"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>有效期 *</label>
              <div className="expiry-inputs">
                <select
                  name="expiry_month"
                  value={formData.expiry_month}
                  onChange={handleChange}
                  required
                >
                  <option value="">月</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString().padStart(2, '0');
                    return <option key={month} value={month}>{month}</option>;
                  })}
                </select>
                <span className="expiry-separator">/</span>
                <select
                  name="expiry_year"
                  value={formData.expiry_year}
                  onChange={handleChange}
                  required
                >
                  <option value="">年</option>
                  {years.map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
              </div>
              {errors.expiry && <span className="error-message">{errors.expiry}</span>}
            </div>

            <div className="form-group">
              <label>CVV *</label>
              <input
                type="text"
                name="cvv"
                value={formData.cvv}
                onChange={handleChange}
                placeholder="123"
                maxLength={4}
                required
              />
              {errors.cvv && <span className="error-message">{errors.cvv}</span>}
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="is_default"
                checked={formData.is_default}
                onChange={handleChange}
              />
              <span>设为默认支付方式</span>
            </label>
          </div>

          <div className="security-notice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>您的支付信息将被安全加密存储</span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-save">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentMethodModal;
