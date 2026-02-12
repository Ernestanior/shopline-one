import React, { useState, useEffect } from 'react';
import type { Address } from '../types/account';
import './AddressModal.css';

interface AddressFormData {
  id?: number;
  label: string;
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  city: string;
  address1: string;
  address2: string;
  postal_code: string;
  is_default: boolean;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Address) => void;
  address?: Address | null;
}

const AddressModal: React.FC<AddressModalProps> = ({ isOpen, onClose, onSave, address }) => {
  const [formData, setFormData] = useState<AddressFormData>({
    label: 'home',
    first_name: '',
    last_name: '',
    phone: '',
    country: 'Taiwan',
    city: '',
    address1: '',
    address2: '',
    postal_code: '',
    is_default: false
  });

  useEffect(() => {
    if (address) {
      setFormData({
        id: address.id,
        label: address.label,
        first_name: address.first_name,
        last_name: address.last_name,
        phone: address.phone,
        country: address.country,
        city: address.city,
        address1: address.address1,
        address2: address.address2,
        postal_code: address.postal_code,
        is_default: Boolean(address.is_default)
      });
    } else {
      setFormData({
        label: 'home',
        first_name: '',
        last_name: '',
        phone: '',
        country: 'Taiwan',
        city: '',
        address1: '',
        address2: '',
        postal_code: '',
        is_default: false
      });
    }
  }, [address, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      is_default: formData.is_default ? 1 : 0
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{address ? '编辑地址' : '添加新地址'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="address-form">
          <div className="form-row">
            <div className="form-group">
              <label>地址标签</label>
              <select name="label" value={formData.label} onChange={handleChange}>
                <option value="home">家</option>
                <option value="work">公司</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>名 *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>姓 *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>电话</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+886"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>国家/地区 *</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>城市 *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>地址 *</label>
            <input
              type="text"
              name="address1"
              value={formData.address1}
              onChange={handleChange}
              placeholder="街道地址"
              required
            />
          </div>

          <div className="form-group">
            <label>地址2（可选）</label>
            <input
              type="text"
              name="address2"
              value={formData.address2}
              onChange={handleChange}
              placeholder="公寓、套房等"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>邮编 *</label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                required
              />
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
              <span>设为默认地址</span>
            </label>
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

export default AddressModal;
