/**
 * API Configuration
 * Configures API base URL for different environments
 */

// Get API URL from environment variable or use default
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8787';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  register: '/api/auth/register',
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  me: '/api/auth/me',

  // Products
  products: '/api/products',
  productDetail: (id: number) => `/api/products/${id}`,
  categories: '/api/categories',

  // Cart
  cart: '/api/cart',
  cartItems: '/api/cart/items',
  cartItem: (id: number) => `/api/cart/items/${id}`,

  // Orders
  orders: '/api/orders',
  userOrders: '/api/user/orders',
  userOrder: (id: number) => `/api/user/orders/${id}`,
  updatePayment: (id: number) => `/api/user/orders/${id}/payment`,

  // User
  profile: '/api/user/profile',
  addresses: '/api/user/addresses',
  address: (id: number) => `/api/user/addresses/${id}`,
  paymentMethods: '/api/user/payment-methods',
  paymentMethod: (id: number) => `/api/user/payment-methods/${id}`,

  // Admin
  adminProducts: '/api/admin/products',
  adminProduct: (id: number) => `/api/admin/products/${id}`,
  adminOrders: '/api/admin/orders',
  adminOrder: (id: number) => `/api/admin/orders/${id}`,
  adminUsers: '/api/admin/users',
  adminFeedback: '/api/admin/feedback',

  // Public
  contact: '/api/contact',
  newsletter: '/api/newsletter/subscribe',
  upload: '/api/upload/product-image'
};

// Helper function to build full URL
export function buildApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}
