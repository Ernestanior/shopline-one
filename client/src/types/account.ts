export interface Address {
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
  is_default: number;
}

export interface PaymentMethod {
  id: number;
  card_type: string;
  card_last4: string;
  card_holder_name: string;
  expiry_month: string;
  expiry_year: string;
  is_default: number;
}

export interface Order {
  id: number;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  items_count: number;
}
