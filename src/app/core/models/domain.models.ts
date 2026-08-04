export type UserRole = 'admin' | 'employee' | 'client';

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  phone?: string;
  active: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  storeId: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  description?: string;
  isActive: boolean;
}

export type OrderStatus = 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  storeId: string;
  createdAt: string;
  items: OrderItem[];
}

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone?: string;
  scheduledAt: string;
  status: 'booked' | 'cancelled';
  storeId: string;
}
