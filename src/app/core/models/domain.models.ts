export type UserRole = 'super_admin' | 'admin' | 'manager' | 'employee' | 'client';

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
  store: Store;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number | null;
  description?: string;
  isActive: boolean;
}

export type OrderStatus = 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice?: number;
}

export interface Order {
  id: string;
  customer: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
  };
  status: OrderStatus;
  totalAmount: number;
  storeId: string;
  createdAt: string;
  items: OrderItem[];
}

export interface CreateOrder {
  customerId: string;
  employeeId: string;
  items: OrderItem[];
  notes: string;
}

export interface Appointment {
  id: string;
  client: {
    id: string;
    fullName: string;
    email: string;
  };
  customerName: string;
  customerPhone?: string;
  scheduledAt: string;
  startsAt: string;
  status: 'booked' | 'cancelled';
  storeId: string;
}

export interface CreateAppointment {
  clientId: string;
  employeeId: string;
  startsAt: Date;
  endsAt: Date;
  status: 'scheduled';
  notes: string;
}