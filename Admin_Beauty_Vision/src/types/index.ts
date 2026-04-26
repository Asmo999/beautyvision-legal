export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  birthday: string | null;
  qrCode: string;
  role: 'customer' | 'admin' | 'superadmin';
}

export interface MeUser extends AuthUser {
  bonusPoints: number;
  orderCount: number;
  cashbackRate: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  brand: Brand | string;
  category: Category | string;
  price: number;
  oldPrice: number | null;
  description: string | null;
  ingredients: string | null;
  howToUse: string | null;
  sizes: string[];
  images: string[];
  tag: 'best' | 'new' | 'sale' | null;
  tagLabel: string | null;
  inStock: boolean;
  isActive: boolean;
  colors: [string, string];
  icon: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface OrderItem {
  product: string | { _id: string; name: string; slug: string; images: string[] };
  name: string;
  brand: string;
  price: number;
  size: string | null;
  qty: number;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  changedAt: string;
  changedBy: string | null;
  note: string | null;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: { _id: string; firstName: string; lastName: string; email: string; qrCode: string } | string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  pointsEarned: number;
  pointsRedeemed: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    city: string;
    address: string;
    zip: string | null;
  } | null;
  notes: string | null;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  _id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  birthday: string | null;
  role: 'customer' | 'admin' | 'superadmin';
  qrCode: string;
  bonusPoints: number;
  physicalSpendTotal: number;
  orderCount: number;
  isVerified: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BonusTransaction {
  _id: string;
  userId: string;
  type: 'scan' | 'order' | 'redemption' | 'admin_adjustment';
  description: string;
  points: number;
  amountGel: number | null;
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  totalPages: number;
  [key: string]: T[] | number;
}

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}
