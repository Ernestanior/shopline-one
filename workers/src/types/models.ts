/**
 * Database models and types
 */

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string | null;
  image: string | null;
  status: string;
  featured: number;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  user_id: number | null;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  shipping_address: string | null;
  shipping_name: string | null;
  shipping_email: string | null;
  shipping_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  subtotal: number;
  created_at: string;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CartItemWithProduct extends CartItem {
  name: string;
  price: number;
  image: string | null;
  status: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: number;
  user_id: number;
  label: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  country: string;
  city: string;
  address1: string;
  address2: string | null;
  postal_code: string;
  is_default: number;
  created_at: string;
  updated_at: string;
}

export interface UserPaymentMethod {
  id: number;
  user_id: number;
  card_type: string;
  card_last4: string;
  card_holder_name: string;
  expiry_month: number;
  expiry_year: number;
  is_default: number;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Payment-related models
export interface PaymentTransaction {
  id: string;
  order_id: string;
  gateway: string;
  gateway_transaction_id: string | null;
  amount: number; // Amount in cents
  currency: string;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  expired_at: string | null;
}

export interface PaymentCallback {
  id: number;
  transaction_id: string;
  gateway: string;
  callback_data: string; // JSON string
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface PaymentRefund {
  id: string;
  transaction_id: string;
  amount: number; // Amount in cents
  reason: string | null;
  status: string;
  gateway_refund_id: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface PaymentSecurityLog {
  id: number;
  event_type: string;
  gateway: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_data: string | null; // JSON string
  created_at: string;
}
