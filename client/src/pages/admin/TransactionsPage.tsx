import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import RefundModal from '../../components/RefundModal';
import './TransactionsPage.css';

interface Transaction {
  id: string;
  orderId: string;
  gateway: string;
  gatewayTransactionId?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

interface TransactionFilters {
  startDate: string;
  endDate: string;
  status: string;
  orderId: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [environment, setEnvironment] = useState<'test' | 'production'>('production');
  
  const [filters, setFilters] = useState<TransactionFilters>({
    startDate: '',
    endDate: '',
    status: '',
    orderId: '',
  });

  useEffect(() => {
    loadTransactions();
    loadEnvironment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEnvironment = async () => {
    try {
      const data = await apiFetch<{ environment: 'test' | 'production' }>('/api/admin/environment');
      setEnvironment(data.environment);
    } catch (err) {
      console.error('Failed to load environment:', err);
      // Default to production if we can't determine
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.orderId) params.append('orderId', filters.orderId);

      const queryString = params.toString();
      const url = `/api/admin/transactions${queryString ? `?${queryString}` : ''}`;

      const data = await apiFetch<{ transactions: Transaction[] }>(url);
      setTransactions(data.transactions || []);
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      setError(err.message || '加载交易记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof TransactionFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    loadTransactions();
  };

  const handleReset = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      orderId: '',
    });
    setTimeout(() => loadTransactions(), 0);
  };

  const handleExportCSV = async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.orderId) params.append('orderId', filters.orderId);

      const queryString = params.toString();
      const url = `/api/admin/transactions/export${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error('Failed to export CSV:', err);
      setError(err.message || '导出CSV失败');
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${currency} ${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'success':
        return 'status-badge success';
      case 'pending':
      case 'processing':
        return 'status-badge pending';
      case 'failed':
        return 'status-badge failed';
      case 'expired':
      case 'cancelled':
        return 'status-badge expired';
      case 'refunded':
        return 'status-badge refunded';
      default:
        return 'status-badge';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待支付',
      processing: '处理中',
      success: '成功',
      failed: '失败',
      expired: '已过期',
      cancelled: '已取消',
      refunded: '已退款',
    };
    return statusMap[status] || status;
  };

  const handleRefundClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowRefundModal(true);
  };

  const handleRefundSuccess = () => {
    loadTransactions();
  };

  const canRefund = (transaction: Transaction) => {
    return transaction.status === 'success' && transaction.paidAt;
  };

  return (
    <div className="transactions-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>交易记录</h1>
            <p className="page-description">查询和管理支付交易记录</p>
          </div>
          <div className={`environment-badge ${environment}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            {environment === 'test' ? '测试环境' : '生产环境'}
          </div>
        </div>

        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="startDate">开始日期</label>
              <input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="endDate">结束日期</label>
              <input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="status">状态</label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">全部</option>
                <option value="pending">待支付</option>
                <option value="processing">处理中</option>
                <option value="success">成功</option>
                <option value="failed">失败</option>
                <option value="expired">已过期</option>
                <option value="cancelled">已取消</option>
                <option value="refunded">已退款</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="orderId">订单ID</label>
              <input
                id="orderId"
                type="text"
                placeholder="输入订单ID"
                value={filters.orderId}
                onChange={(e) => handleFilterChange('orderId', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-actions">
            <button onClick={handleSearch} className="btn-primary">
              搜索
            </button>
            <button onClick={handleReset} className="btn-secondary">
              重置
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>加载中...</p>
          </div>
        ) : (
          <div className="transactions-section">
            <div className="transactions-header">
              <h2>交易列表</h2>
              <div className="transactions-actions">
                <span className="transaction-count">
                  共 {transactions.length} 条记录
                </span>
                <button onClick={handleExportCSV} className="btn-export">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  导出CSV
                </button>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="empty-state">
                <p>没有找到交易记录</p>
              </div>
            ) : (
              <div className="transactions-table-wrapper">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>交易ID</th>
                      <th>订单ID</th>
                      <th>支付网关</th>
                      <th>支付方式</th>
                      <th>金额</th>
                      <th>状态</th>
                      <th>创建时间</th>
                      <th>支付时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="transaction-id">
                          <span title={transaction.id}>
                            {transaction.id.substring(0, 8)}...
                          </span>
                        </td>
                        <td>{transaction.orderId}</td>
                        <td>
                          <span className="gateway-badge">
                            {transaction.gateway === 'newebpay' ? '蓝新金流' : '绿界科技'}
                          </span>
                        </td>
                        <td>{transaction.paymentMethod}</td>
                        <td className="amount">
                          {formatAmount(transaction.amount, transaction.currency)}
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(transaction.status)}>
                            {getStatusText(transaction.status)}
                          </span>
                        </td>
                        <td>{formatDate(transaction.createdAt)}</td>
                        <td>
                          {transaction.paidAt ? formatDate(transaction.paidAt) : '-'}
                        </td>
                        <td>
                          {canRefund(transaction) ? (
                            <button
                              onClick={() => handleRefundClick(transaction)}
                              className="btn-refund"
                            >
                              退款
                            </button>
                          ) : (
                            <span className="no-action">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showRefundModal && selectedTransaction && (
        <RefundModal
          transaction={selectedTransaction}
          onClose={() => setShowRefundModal(false)}
          onSuccess={handleRefundSuccess}
        />
      )}
    </div>
  );
}
