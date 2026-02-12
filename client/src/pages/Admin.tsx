import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import './Admin.css';

interface User {
  id: number;
  email: string;
  is_admin: number;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  stock: number;
  status: string;
  featured: number;
}

interface Order {
  id: number;
  order_number: string;
  user_email: string;
  total_amount: number;
  status: string;
  payment_status: string;
  items_count: number;
  created_at: string;
}

interface Stats {
  users: { total: number; admins: number };
  products: { total: number; available: number; featured: number };
  orders: { total: number; pending: number; completed: number; total_revenue: number };
  today: { count: number; revenue: number };
  feedback: { total: number; pending: number };
  subscribers: { total: number };
}

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'products' | 'orders' | 'feedback' | 'subscribers'>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'feedback') {
      fetchFeedback();
    } else if (activeTab === 'subscribers') {
      fetchSubscribers();
    }
  }, [activeTab]);

  const checkAuth = async () => {
    try {
      const response = await apiFetch<{ user: { id: number; email: string; is_admin: number } }>('/api/auth/me');
      console.log('Admin auth check:', response);
      if (!response.user || !response.user.is_admin) {
        console.log('Not admin, redirecting to login');
        navigate('/login');
        return;
      }
      console.log('Admin authenticated successfully');
      setLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/login');
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiFetch<Stats>('/api/admin/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiFetch<{ users: User[] }>('/api/admin/users');
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiFetch<{ products: Product[] }>('/api/admin/products');
      setProducts(data.products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await apiFetch<{ orders: Order[] }>('/api/admin/orders');
      setOrders(data.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const fetchFeedback = async () => {
    try {
      const data = await apiFetch<{ feedback: any[] }>('/api/admin/feedback');
      setFeedback(data.feedback);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const data = await apiFetch<{ subscribers: any[] }>('/api/admin/subscribers');
      setSubscribers(data.subscribers);
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
    }
  };

  const deleteUser = async (id: number) => {
    if (!window.confirm('确定要删除此用户吗？')) return;
    try {
      await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      fetchUsers();
      showMessage('用户删除成功');
    } catch (error) {
      showMessage('删除失败', 'error');
    }
  };

  const deleteProduct = async (id: number) => {
    if (!window.confirm('确定要删除此商品吗？')) return;
    try {
      await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      fetchProducts();
      showMessage('商品删除成功');
    } catch (error) {
      showMessage('删除失败', 'error');
    }
  };

  const saveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const product = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      price: parseFloat(formData.get('price') as string),
      description: formData.get('description') as string,
      image: formData.get('image') as string,
      stock: parseInt(formData.get('stock') as string),
      status: formData.get('status') as string,
      featured: formData.get('featured') === 'on' ? 1 : 0
    };

    try {
      if (editingProduct) {
        await apiFetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          json: product
        });
        showMessage('商品更新成功');
      } else {
        await apiFetch('/api/admin/products', {
          method: 'POST',
          json: product
        });
        showMessage('商品添加成功');
      }
      setShowProductForm(false);
      setEditingProduct(null);
      setImagePreview(null);
      fetchProducts();
    } catch (error) {
      showMessage('保存失败', 'error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:5002/api/upload/product-image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the image input value
        const imageInput = document.querySelector('input[name="image"]') as HTMLInputElement;
        if (imageInput) {
          imageInput.value = data.path;
        }
        setImagePreview(data.path);
        showMessage('图片上传成功');
      } else {
        showMessage('图片上传失败', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showMessage('图片上传失败', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      await apiFetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        json: { status }
      });
      showMessage('订单状态更新成功');
      fetchOrders();
    } catch (error) {
      showMessage('更新失败', 'error');
    }
  };

  const updateFeedbackStatus = async (id: number, status: string) => {
    try {
      await apiFetch(`/api/admin/feedback/${id}/status`, {
        method: 'PATCH',
        json: { status }
      });
      showMessage('反馈状态更新成功');
      fetchFeedback();
    } catch (error) {
      showMessage('更新失败', 'error');
    }
  };

  const deleteFeedback = async (id: number) => {
    if (!window.confirm('确定要删除此反馈吗？')) return;
    try {
      await apiFetch(`/api/admin/feedback/${id}`, { method: 'DELETE' });
      showMessage('反馈删除成功');
      fetchFeedback();
    } catch (error) {
      showMessage('删除失败', 'error');
    }
  };

  const deleteSubscriber = async (id: number) => {
    if (!window.confirm('确定要删除此订阅者吗？')) return;
    try {
      await apiFetch(`/api/admin/subscribers/${id}`, { method: 'DELETE' });
      showMessage('订阅者删除成功');
      fetchSubscribers();
    } catch (error) {
      showMessage('删除失败', 'error');
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading...</div>;
  }

  return (
    <div className="admin">
      {message && (
        <div className={`admin-message admin-message--${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="admin-header">
        <h1>管理后台</h1>
        <button onClick={() => navigate('/')} className="btn-back">返回首页</button>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          仪表板
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          用户管理
        </button>
        <button 
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          商品管理
        </button>
        <button 
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          订单管理
        </button>
        <button 
          className={activeTab === 'feedback' ? 'active' : ''}
          onClick={() => setActiveTab('feedback')}
        >
          用户反馈
        </button>
        <button 
          className={activeTab === 'subscribers' ? 'active' : ''}
          onClick={() => setActiveTab('subscribers')}
        >
          邮件订阅
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && stats && (
          <div className="dashboard">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>用户总数</h3>
                <div className="stat-value">{stats.users.total}</div>
                <div className="stat-label">管理员: {stats.users.admins}</div>
              </div>
              <div className="stat-card">
                <h3>商品总数</h3>
                <div className="stat-value">{stats.products.total}</div>
                <div className="stat-label">上架: {stats.products.available}</div>
              </div>
              <div className="stat-card">
                <h3>订单总数</h3>
                <div className="stat-value">{stats.orders.total}</div>
                <div className="stat-label">待处理: {stats.orders.pending}</div>
              </div>
              <div className="stat-card">
                <h3>总收入</h3>
                <div className="stat-value">${Number(stats.orders.total_revenue || 0).toFixed(2)}</div>
                <div className="stat-label">今日: ${Number(stats.today.revenue || 0).toFixed(2)}</div>
              </div>
              <div className="stat-card">
                <h3>用户反馈</h3>
                <div className="stat-value">{stats.feedback?.total || 0}</div>
                <div className="stat-label">待处理: {stats.feedback?.pending || 0}</div>
              </div>
              <div className="stat-card">
                <h3>邮件订阅</h3>
                <div className="stat-value">{stats.subscribers?.total || 0}</div>
                <div className="stat-label">活跃订阅者</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <h2>用户列表</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>邮箱</th>
                  <th>管理员</th>
                  <th>注册时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>{user.is_admin ? '是' : '否'}</td>
                    <td>{new Date(user.created_at).toLocaleString()}</td>
                    <td>
                      <button onClick={() => deleteUser(user.id)} className="btn-delete">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="products-section">
            <div className="section-header">
              <h2>商品列表</h2>
              <button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="btn-add">
                添加商品
              </button>
            </div>

            {showProductForm && (
              <div className="modal">
                <div className="modal-content">
                  <h3>{editingProduct ? '编辑商品' : '添加商品'}</h3>
                  <form onSubmit={saveProduct}>
                    <input name="name" placeholder="商品名称" defaultValue={editingProduct?.name} required />
                    <select name="category" defaultValue={editingProduct?.category} required>
                      <option value="productivity">Productivity</option>
                      <option value="mobility">Mobility</option>
                      <option value="sanctuary">Sanctuary</option>
                      <option value="savoriness">Savoriness</option>
                    </select>
                    <input name="price" type="number" step="0.01" placeholder="价格" defaultValue={editingProduct?.price} required />
                    <textarea name="description" placeholder="描述" defaultValue={editingProduct?.description} required />
                    
                    <div className="image-upload-section">
                      <label>商品图片</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                      {uploadingImage && <span>上传中...</span>}
                      {(imagePreview || editingProduct?.image) && (
                        <img 
                          src={imagePreview || editingProduct?.image} 
                          alt="预览" 
                          style={{width: 100, height: 100, objectFit: 'cover', marginTop: 10}}
                        />
                      )}
                      <input 
                        name="image" 
                        type="hidden" 
                        defaultValue={editingProduct?.image} 
                        required 
                      />
                    </div>
                    
                    <input name="stock" type="number" placeholder="库存" defaultValue={editingProduct?.stock} required />
                    <select name="status" defaultValue={editingProduct?.status} required>
                      <option value="available">上架</option>
                      <option value="coming-soon">即将上架</option>
                    </select>
                    <label>
                      <input name="featured" type="checkbox" defaultChecked={editingProduct?.featured === 1} />
                      精选商品
                    </label>
                    <div className="form-actions">
                      <button type="submit" className="btn-save">保存</button>
                      <button type="button" onClick={() => { setShowProductForm(false); setEditingProduct(null); setImagePreview(null); }} className="btn-cancel">
                        取消
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>图片</th>
                  <th>名称</th>
                  <th>分类</th>
                  <th>价格</th>
                  <th>库存</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        style={{width: 50, height: 50, objectFit: 'cover'}}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                        }}
                        loading="lazy"
                      />
                    </td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>${product.price}</td>
                    <td>{product.stock}</td>
                    <td>{product.status}</td>
                    <td>
                      <button onClick={() => { setEditingProduct(product); setShowProductForm(true); }} className="btn-edit">编辑</button>
                      <button onClick={() => deleteProduct(product.id)} className="btn-delete">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <h2>订单列表</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>用户</th>
                  <th>金额</th>
                  <th>商品数</th>
                  <th>状态</th>
                  <th>支付状态</th>
                  <th>时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.order_number}</td>
                    <td>{order.user_email}</td>
                    <td>${order.total_amount}</td>
                    <td>{order.items_count}</td>
                    <td>
                      <select 
                        value={order.status} 
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      >
                        <option value="pending">待处理</option>
                        <option value="processing">处理中</option>
                        <option value="shipped">已发货</option>
                        <option value="completed">已完成</option>
                        <option value="cancelled">已取消</option>
                      </select>
                    </td>
                    <td>{order.payment_status}</td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                    <td>
                      <button onClick={() => navigate(`/orders/${order.id}`)} className="btn-view">查看</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="feedback-section">
            <h2>用户反馈</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>姓名</th>
                  <th>邮箱</th>
                  <th>主题</th>
                  <th>消息</th>
                  <th>状态</th>
                  <th>时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {feedback.map(item => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>{item.subject || '-'}</td>
                    <td style={{maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                      {item.message}
                    </td>
                    <td>
                      <select 
                        value={item.status} 
                        onChange={(e) => updateFeedbackStatus(item.id, e.target.value)}
                      >
                        <option value="pending">待处理</option>
                        <option value="replied">已回复</option>
                        <option value="resolved">已解决</option>
                      </select>
                    </td>
                    <td>{new Date(item.created_at).toLocaleString()}</td>
                    <td>
                      <button onClick={() => deleteFeedback(item.id)} className="btn-delete">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'subscribers' && (
          <div className="subscribers-section">
            <h2>邮件订阅列表</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>邮箱</th>
                  <th>状态</th>
                  <th>订阅时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map(sub => (
                  <tr key={sub.id}>
                    <td>{sub.id}</td>
                    <td>{sub.email}</td>
                    <td>{sub.status}</td>
                    <td>{new Date(sub.created_at).toLocaleString()}</td>
                    <td>
                      <button onClick={() => deleteSubscriber(sub.id)} className="btn-delete">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
