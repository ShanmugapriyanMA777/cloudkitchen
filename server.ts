import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Order, MenuItem, DashboardMetrics, DailyMetrics } from './src/types';
import { MENU_ITEMS } from './src/data/menu';

// Simple in-memory database
let orders: Order[] = [];

// Seed historical orders for a spectacular analytics dashboard
const seedOrders = (): Order[] => {
  const seeded: Order[] = [];
  const now = new Date();
  
  // Create 15-20 historical orders over the past 7 days
  const categories: ('starters' | 'mains' | 'desserts' | 'beverages' | 'combos')[] = 
    ['starters', 'mains', 'desserts', 'beverages', 'combos'];

  for (let i = 15; i >= 1; i--) {
    const orderDate = new Date(now.getTime() - i * 12 * 60 * 60 * 1000); // every 12 hours
    const item1 = MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)];
    const item2 = MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)];
    
    const qty1 = Math.floor(Math.random() * 2) + 1;
    const qty2 = Math.floor(Math.random() * i % 2) + 1;
    
    const items = [
      { id: item1.id, menuItem: item1, quantity: qty1 },
      ...(item1.id !== item2.id ? [{ id: item2.id, menuItem: item2, quantity: qty2 }] : [])
    ];
    
    const subtotal = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
    const gst = Math.round(subtotal * 0.05);
    const deliveryFee = subtotal >= 499 ? 0 : 40;
    const total = subtotal + gst + deliveryFee;
    
    seeded.push({
      id: `ord-seed-${1000 + i}`,
      items,
      customerName: ['Aarav Sharma', 'Meera Patel', 'Kabir Singh', 'Rhea Sen', 'Aditya Verma', 'Ananya Roy'][i % 6],
      customerEmail: `customer${i}@example.com`,
      customerPhone: `+91 98765 4321${i % 10}`,
      deliveryAddress: `${10 + i}, Luxury Heights, Sector ${50 + i}, New Delhi`,
      subtotal,
      gst,
      deliveryFee,
      total,
      paymentStatus: 'completed',
      orderStatus: 'delivered',
      createdAt: orderDate.toISOString()
    });
  }
  return seeded;
};

orders = seedOrders();

// Helper to progress active orders automatically
const startOrderStatusSimulator = (orderId: string) => {
  // Timer to step through order statuses
  const progressionTimeouts = [
    { status: 'preparing' as const, delay: 12000 },       // after 12s, prepare
    { status: 'out_for_delivery' as const, delay: 28000 }, // after 28s, out for delivery
    { status: 'delivered' as const, delay: 50000 }        // after 50s, delivered
  ];

  progressionTimeouts.forEach(({ status, delay }) => {
    setTimeout(() => {
      const order = orders.find(o => o.id === orderId);
      if (order && order.paymentStatus === 'completed' && order.orderStatus !== 'delivered') {
        order.orderStatus = status;
        console.log(`[Simulator] Order ${orderId} is now ${status}`);
      }
    }, delay);
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON and urlencode parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API: Get Menu
  app.get('/api/menu', (req, res) => {
    res.json(MENU_ITEMS);
  });

  // API: Checkout & Create Razorpay Order Simulator
  app.post('/api/checkout', (req, res) => {
    const { items, customerName, customerEmail, customerPhone, deliveryAddress, subtotal, gst, deliveryFee, total } = req.body;

    if (!items || !customerName || !customerEmail || !deliveryAddress) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const orderId = `ord-${Date.now()}`;
    const razorpayOrderId = `rzp_order_${Math.random().toString(36).substring(2, 11)}`;

    const newOrder: Order = {
      id: orderId,
      items,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      deliveryAddress,
      subtotal,
      gst,
      deliveryFee,
      total,
      paymentStatus: 'pending',
      orderStatus: 'placed',
      razorpayOrderId,
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);

    res.status(201).json({
      success: true,
      orderId,
      razorpayOrderId,
      amount: total * 100, // in paise
      currency: 'INR'
    });
  });

  // API: Verify Razorpay Payment Simulator
  app.post('/api/verify-payment', (req, res) => {
    const { orderId, razorpayPaymentId, razorpayOrderId, status } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId' });
    }

    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (status === 'failed') {
      orders[orderIndex].paymentStatus = 'failed';
      return res.json({ success: false, message: 'Payment failed' });
    }

    // Update order status to paid and placed
    orders[orderIndex].paymentStatus = 'completed';
    orders[orderIndex].orderStatus = 'placed';
    orders[orderIndex].razorpayPaymentId = razorpayPaymentId || `pay_${Math.random().toString(36).substring(2, 11)}`;

    console.log(`[Server] Payment Verified for Order ${orderId}. Starting tracking simulation.`);
    
    // Start active real-time status progression simulator
    startOrderStatusSimulator(orderId);

    res.json({
      success: true,
      order: orders[orderIndex]
    });
  });

  // API: Get Order tracking status
  app.get('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const order = orders.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  });

  // API: Get Admin Metrics with analytics calculations
  app.get('/api/admin/metrics', (req, res) => {
    const completedOrders = orders.filter(o => o.paymentStatus === 'completed');
    const totalOrders = completedOrders.length;
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const activeOrders = completedOrders.filter(o => o.orderStatus !== 'delivered').length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Category Sales Count stats
    const categoryMap: { [key: string]: { count: number; sales: number } } = {
      starters: { count: 0, sales: 0 },
      mains: { count: 0, sales: 0 },
      desserts: { count: 0, sales: 0 },
      beverages: { count: 0, sales: 0 },
      combos: { count: 0, sales: 0 }
    };

    completedOrders.forEach(order => {
      order.items.forEach(item => {
        const cat = item.menuItem.category;
        if (categoryMap[cat]) {
          categoryMap[cat].count += item.quantity;
          categoryMap[cat].sales += item.menuItem.price * item.quantity;
        }
      });
    });

    const categoryStats = Object.keys(categoryMap).map(cat => ({
      category: cat.charAt(0).toUpperCase() + cat.slice(1),
      count: categoryMap[cat].count,
      sales: categoryMap[cat].sales
    }));

    // Historic Daily Sales stats (last 7 days)
    const historyMap: { [key: string]: { sales: number; orders: number } } = {};
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      historyMap[dateString] = { sales: 0, orders: 0 };
    }

    completedOrders.forEach(order => {
      const d = new Date(order.createdAt);
      const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (historyMap[dateString] !== undefined) {
        historyMap[dateString].sales += order.total;
        historyMap[dateString].orders += 1;
      }
    });

    const salesHistory = Object.keys(historyMap).map(date => ({
      date,
      sales: historyMap[date].sales,
      orders: historyMap[date].orders
    }));

    const metrics: DashboardMetrics = {
      totalOrders,
      totalRevenue,
      activeOrders,
      averageOrderValue,
      categoryStats,
      salesHistory
    };

    res.json(metrics);
  });

  // Supabase Schema Endpoint (Returns raw schema for copy/pasting if they want to load into original Postgres DB)
  app.get('/api/supabase-schema', (req, res) => {
    const ddl = `
-- BITECTRAFT CLOUD KITCHEN - SUPABASE PGSQL SCHEMA
-- Run this schema in your Supabase SQL Editor.

-- 1. Create custom types
CREATE TYPE item_category AS ENUM ('starters', 'mains', 'desserts', 'beverages', 'combos');
CREATE TYPE order_status AS ENUM ('placed', 'preparing', 'out_for_delivery', 'delivered');
CREATE TYPE payment_status_type AS ENUM ('pending', 'completed', 'failed');

-- 2. Create users/profiles table (optional, syncs with Supabase Auth auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can edit their own profiles." ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Public profiles are viewable." ON public.profiles FOR SELECT USING (true);

-- 3. Create menu table
CREATE TABLE public.menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price INT NOT NULL,
    category item_category NOT NULL,
    image TEXT,
    is_veg BOOLEAN DEFAULT TRUE NOT NULL,
    rating NUMERIC(3,2) DEFAULT 4.5 NOT NULL,
    is_popular BOOLEAN DEFAULT FALSE,
    preparation_time INT DEFAULT 15,
    calories INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Only admins can modify menu" ON public.menu_items FOR ALL USING (auth.role() = 'service_role');

-- 4. Create orders table
CREATE TABLE public.orders (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    delivery_address TEXT NOT NULL,
    subtotal INT NOT NULL,
    gst INT NOT NULL,
    delivery_fee INT NOT NULL,
    total INT NOT NULL,
    payment_status payment_status_type DEFAULT 'pending'::payment_status_type NOT NULL,
    order_status order_status DEFAULT 'placed'::order_status NOT NULL,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "Anyone can insert orders (checkout)" ON public.orders FOR INSERT WITH CHECK (true);

-- 5. Create order items table
CREATE TABLE public.order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    menu_item_id TEXT REFERENCES public.menu_items(id) NOT NULL,
    quantity INT NOT NULL,
    custom_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own order items." ON public.order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE public.orders.id = public.order_items.order_id 
        AND (public.orders.user_id = auth.uid() OR auth.role() = 'service_role')
    )
);
CREATE POLICY "Anyone can insert order items." ON public.order_items FOR INSERT WITH CHECK (true);

-- Seed menu items
INSERT INTO public.menu_items (id, name, description, price, category, image, is_veg, rating, is_popular, preparation_time, calories) VALUES
('starter-1', 'Truffle Parmesan Fries', 'Crispy hand-cut golden fries tossed in organic white truffle oil, freshly grated Parmigiano-Reggiano, and chopped rosemary.', 320, 'starters', 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=600', TRUE, 4.8, TRUE, 12, 420),
('main-1', 'Artisanal Burrata Margherita Pizza', 'Slow-fermented sourdough crust topped with San Marzano tomato sauce, fresh creamy burrata, organic basil, and extra virgin olive oil.', 650, 'mains', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600', TRUE, 4.9, TRUE, 20, 820);
    `;
    res.type('text/plain').send(ddl);
  });

  // Serve static UI assets and handle spa route fallback in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BiteCraft Server running on host http://0.0.0.0:${PORT}`);
  });
}

startServer();
