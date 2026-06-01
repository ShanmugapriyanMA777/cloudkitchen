export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'starters' | 'mains' | 'desserts' | 'beverages' | 'combos';
  image: string;
  isVeg: boolean;
  rating: number;
  isPopular?: boolean;
  preparationTime: number; // in minutes
  calories?: number;
}

export interface CartItem {
  id: string; // id is MenuItem.id
  menuItem: MenuItem;
  quantity: number;
  customInstructions?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  subtotal: number;
  gst: number;
  deliveryFee: number;
  total: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  orderStatus: 'placed' | 'preparing' | 'out_for_delivery' | 'delivered';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

export interface DailyMetrics {
  date: string;
  sales: number;
  orders: number;
}

export interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  activeOrders: number;
  averageOrderValue: number;
  categoryStats: { category: string; count: number; sales: number }[];
  salesHistory: DailyMetrics[];
}
