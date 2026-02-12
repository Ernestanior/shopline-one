import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../lib/api';
import AddressModal from '../components/AddressModal';
import PaymentMethodModal from '../components/PaymentMethodModal';
import type { Address, PaymentMethod, Order } from '../types/account';
import './Account.css';

const Account: React.FC = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'payments'>('profile');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'addresses') {
      fetchAddresses();
    } else if (activeTab === 'payments') {
      fetchPaymentMethods();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ orders: Order[] }>('/api/user/orders');
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ addresses: Address[] }>('/api/user/addresses');
      setAddresses(data.addresses || []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ payment_methods: PaymentMethod[] }>('/api/user/payment-methods');
      setPaymentMethods(data.payment_methods || []);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setShowAddressModal(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress({
      ...address,
      is_default: address.is_default
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (addressData: Address) => {
    try {
      if (addressData.id) {
        // Update existing address
        await apiFetch(`/api/user/addresses/${addressData.id}`, {
          method: 'PUT',
          json: {
            label: addressData.label,
            first_name: addressData.first_name,
            last_name: addressData.last_name,
            phone: addressData.phone,
            country: addressData.country,
            city: addressData.city,
            address1: addressData.address1,
            address2: addressData.address2,
            postal_code: addressData.postal_code,
            is_default: addressData.is_default ? 1 : 0
          }
        });
      } else {
        // Create new address
        await apiFetch('/api/user/addresses', {
          method: 'POST',
          json: {
            label: addressData.label,
            first_name: addressData.first_name,
            last_name: addressData.last_name,
            phone: addressData.phone,
            country: addressData.country,
            city: addressData.city,
            address1: addressData.address1,
            address2: addressData.address2,
            postal_code: addressData.postal_code,
            is_default: addressData.is_default ? 1 : 0
          }
        });
      }
      setShowAddressModal(false);
      fetchAddresses();
    } catch (error) {
      console.error('Failed to save address:', error);
      alert('保存地址失败，请重试');
    }
  };

  const deleteAddress = async (id: number) => {
    if (!window.confirm('确定要删除此地址吗？')) return;
    try {
      await apiFetch(`/api/user/addresses/${id}`, { method: 'DELETE' });
      fetchAddresses();
    } catch (error) {
      console.error('Failed to delete address:', error);
    }
  };

  const handleAddPaymentMethod = () => {
    setShowPaymentModal(true);
  };

  const handleSavePaymentMethod = async (methodData: {
    card_type: string;
    card_number: string;
    card_holder_name: string;
    expiry_month: string;
    expiry_year: string;
    cvv: string;
    is_default: boolean;
  }) => {
    try {
      const cleanedCardNumber = methodData.card_number.replace(/\s/g, '');
      const last4 = cleanedCardNumber.slice(-4);

      await apiFetch('/api/user/payment-methods', {
        method: 'POST',
        json: {
          card_type: methodData.card_type,
          card_last4: last4,
          card_holder_name: methodData.card_holder_name,
          expiry_month: methodData.expiry_month,
          expiry_year: methodData.expiry_year,
          is_default: methodData.is_default ? 1 : 0
        }
      });
      setShowPaymentModal(false);
      fetchPaymentMethods();
    } catch (error) {
      console.error('Failed to save payment method:', error);
      alert('保存支付方式失败，请重试');
    }
  };

  const deletePaymentMethod = async (id: number) => {
    if (!window.confirm('确定要删除此支付方式吗？')) return;
    try {
      await apiFetch(`/api/user/payment-methods/${id}`, { method: 'DELETE' });
      fetchPaymentMethods();
    } catch (error) {
      console.error('Failed to delete payment method:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      shipped: '#8b5cf6',
      completed: '#10b981',
      cancelled: '#ef4444'
    };
    return colors[status] || '#666666';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      shipped: '已发货',
      completed: '已完成',
      cancelled: '已取消'
    };
    return texts[status] || status;
  };

  return (
    <div className="account">
      <div className="container">
        <div className="account-header">
          <h1>我的账户</h1>
          <button onClick={logout} className="btn-logout">退出登录</button>
        </div>

        <div className="account-tabs">
          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            个人信息
          </button>
          <button
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            订单历史
          </button>
          <button
            className={activeTab === 'addresses' ? 'active' : ''}
            onClick={() => setActiveTab('addresses')}
          >
            收货地址
          </button>
          <button
            className={activeTab === 'payments' ? 'active' : ''}
            onClick={() => setActiveTab('payments')}
          >
            支付方式
          </button>
        </div>

        <div className="account-content">
          {activeTab === 'profile' && (
            <div className="account-card">
              <h2>账户信息</h2>
              <div className="account-info">
                <div className="info-row">
                  <span className="info-label">邮箱地址</span>
                  <span className="info-value">{user?.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">账户类型</span>
                  <span className="info-value">
                    {user?.is_admin ? '管理员' : '普通用户'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">账户状态</span>
                  <span className="info-value status-active">活跃</span>
                </div>
              </div>

              {user?.is_admin && (
                <div className="admin-notice">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>您拥有管理员权限</span>
                  <Link to="/admin" className="btn-admin">进入管理后台</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="orders-section">
              <h2>订单历史</h2>
              
              {loading ? (
                <div className="loading-state">加载中...</div>
              ) : orders.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 2 3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9l-6-7z"></path>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <path d="M9 22V12h6v10"></path>
                  </svg>
                  <h3>暂无订单</h3>
                  <p>您还没有下过订单</p>
                  <Link to="/collections/productivity" className="btn-shop">开始购物</Link>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((order) => (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <div className="order-number">
                          <span className="label">订单号</span>
                          <span className="value">{order.order_number}</span>
                        </div>
                        <div className="order-date">
                          {new Date(order.created_at).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>

                      <div className="order-body">
                        <div className="order-info">
                          <div className="info-item">
                            <span className="label">商品数量</span>
                            <span className="value">{order.items_count} 件</span>
                          </div>
                          <div className="info-item">
                            <span className="label">订单金额</span>
                            <span className="value amount">${order.total_amount}</span>
                          </div>
                          <div className="info-item">
                            <span className="label">订单状态</span>
                            <span 
                              className="value status"
                              style={{ color: getStatusColor(order.status) }}
                            >
                              {getStatusText(order.status)}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="label">支付状态</span>
                            <span className="value">
                              {order.payment_status === 'paid' ? '已支付' : '未支付'}
                            </span>
                          </div>
                        </div>

                        <div className="order-actions">
                          <Link to={`/orders/${order.id}`} className="btn-view-order">
                            查看详情
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="addresses-section">
              <div className="section-header">
                <h2>收货地址</h2>
                <button className="btn-add" onClick={handleAddAddress}>+ 添加新地址</button>
              </div>

              {loading ? (
                <div className="loading-state">加载中...</div>
              ) : addresses.length === 0 ? (
                <div className="empty-state">
                  <h3>暂无收货地址</h3>
                  <p>添加收货地址以便快速结账</p>
                </div>
              ) : (
                <div className="addresses-grid">
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`address-card ${addr.is_default ? 'default' : ''}`}>
                      {addr.is_default && <span className="default-badge">默认</span>}
                      <div className="address-name">{addr.first_name} {addr.last_name}</div>
                      <div className="address-details">
                        <div>{addr.address1}</div>
                        {addr.address2 && <div>{addr.address2}</div>}
                        <div>{addr.city}, {addr.postal_code}</div>
                        <div>{addr.country}</div>
                        {addr.phone && <div>电话: {addr.phone}</div>}
                      </div>
                      <div className="address-actions">
                        <button className="btn-edit-small" onClick={() => handleEditAddress(addr)}>编辑</button>
                        <button className="btn-delete-small" onClick={() => addr.id && deleteAddress(addr.id)}>删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="payments-section">
              <div className="section-header">
                <h2>支付方式</h2>
                <button className="btn-add" onClick={handleAddPaymentMethod}>+ 添加支付方式</button>
              </div>

              {loading ? (
                <div className="loading-state">加载中...</div>
              ) : paymentMethods.length === 0 ? (
                <div className="empty-state">
                  <h3>暂无支付方式</h3>
                  <p>添加支付方式以便快速结账</p>
                </div>
              ) : (
                <div className="payments-grid">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className={`payment-card ${method.is_default ? 'default' : ''}`}>
                      {method.is_default && <span className="default-badge">默认</span>}
                      <div className="card-type">{method.card_type}</div>
                      <div className="card-number">•••• •••• •••• {method.card_last4}</div>
                      <div className="card-holder">{method.card_holder_name}</div>
                      <div className="card-expiry">有效期: {method.expiry_month}/{method.expiry_year}</div>
                      <div className="payment-actions">
                        <button className="btn-delete-small" onClick={() => deletePaymentMethod(method.id)}>删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSave={handleSaveAddress}
        address={editingAddress}
      />

      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSave={handleSavePaymentMethod}
      />
    </div>
  );
};

export default Account;
