import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';
import { Order, MenuItem, DashboardMetrics } from './src/types';
import { MENU_ITEMS } from './src/data/menu';

// Load environment variables
dotenv.config();

const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'database.json')
  : path.join(process.cwd(), 'database.json');

interface DatabaseSchema {
  menu: MenuItem[];
  orders: Order[];
}

// Seed historical orders for a spectacular analytics dashboard
const seedOrders = (): Order[] => {
  const seeded: Order[] = [];
  const now = new Date();
  
  // Create 15-20 historical orders over the past 7 days
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

// Initialize the file-based database
const initDB = (): DatabaseSchema => {
  if (fs.existsSync(DB_PATH)) {
    try {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('[Database] Read or parse error, re-seeding default database:', err);
    }
  }

  // Pre-populate database with default items and historical orders
  const initialData: DatabaseSchema = {
    menu: MENU_ITEMS,
    orders: seedOrders()
  };
  
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    console.log('[Database] Seeded database.json successfully');
  } catch (err) {
    console.error('[Database] Error seeding database file:', err);
  }
  
  return initialData;
};

// Load initial state
const localCachedDB = initDB();

// Database read/write functions
const getOrdersFromDB = (): Order[] => {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      return parsed.orders || [];
    }
  } catch (e) {
    console.error('[Database] Error reading orders:', e);
  }
  return localCachedDB.orders;
};

const getMenuFromDB = (): MenuItem[] => {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      return parsed.menu || MENU_ITEMS;
    }
  } catch (e) {
    console.error('[Database] Error reading menu:', e);
  }
  return localCachedDB.menu;
};

const saveOrdersToDB = (ordersList: Order[]) => {
  try {
    const current = fs.existsSync(DB_PATH) ? JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) : { menu: MENU_ITEMS, orders: [] };
    current.orders = ordersList;
    fs.writeFileSync(DB_PATH, JSON.stringify(current, null, 2), 'utf-8');
    localCachedDB.orders = ordersList;
  } catch (err) {
    console.error('[Database] Error saving orders:', err);
  }
};

// ----------------- SUPABASE INTEGRATION ENGINE -----------------

// Lazy-initialize Supabase client
let supabaseClientCache: any = null;

function getSupabaseClient() {
  if (supabaseClientCache) return supabaseClientCache;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      supabaseClientCache = createClient(url, key, {
        auth: {
          persistSession: false
        }
      });
      console.log('[Supabase] Initialized client successfully with url:', url);
      
      // Seed default dishes if table exists but has 0 records
      seedSupabaseMenuIfNeeded(supabaseClientCache);
      
      return supabaseClientCache;
    } catch (err) {
      console.error('[Supabase] Initialization failed:', err);
    }
  }
  return null;
}

// Convert DB snake_case row to UI camelCase MenuItem
function mapDBToMenuItem(row: any): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price),
    category: row.category,
    image: row.image || '',
    video: row.video || undefined,
    isVeg: !!row.is_veg,
    rating: Number(row.rating || 4.5),
    isPopular: !!row.is_popular,
    preparationTime: Number(row.preparation_time || 15),
    calories: row.calories ? Number(row.calories) : undefined
  };
}

// Convert UI camelCase MenuItem to DB snake_case row
function mapMenuItemToDB(item: MenuItem): any {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    image: item.image,
    video: item.video || null,
    is_veg: item.isVeg,
    rating: item.rating,
    is_popular: item.isPopular || false,
    preparation_time: item.preparationTime,
    calories: item.calories || null
  };
}

// Map nested Supabase database tables order-with-items response to frontend types
function mapDBOrderWithItemsToOrder(orderDB: any): Order {
  const items = (orderDB.order_items || []).map((oi: any) => {
    // If we have associated menu item, map it, otherwise provide robust default
    const itemMenu = oi.menu_items ? mapDBToMenuItem(oi.menu_items) : {
      id: oi.menu_item_id,
      name: 'Exquisite Culinary Masterpiece',
      description: 'Hand-crafted exquisite cloud kitchen entree',
      price: 0,
      category: 'mains' as const,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      isVeg: true,
      rating: 4.8,
      preparationTime: 15
    };

    return {
      id: oi.menu_item_id,
      quantity: Number(oi.quantity),
      customInstructions: oi.custom_instructions || undefined,
      menuItem: itemMenu
    };
  });

  return {
    id: orderDB.id,
    customerName: orderDB.customer_name,
    customerEmail: orderDB.customer_email,
    customerPhone: orderDB.customer_phone || '',
    deliveryAddress: orderDB.delivery_address,
    subtotal: Number(orderDB.subtotal),
    gst: Number(orderDB.gst),
    deliveryFee: Number(orderDB.delivery_fee),
    total: Number(orderDB.total),
    paymentStatus: orderDB.payment_status,
    orderStatus: orderDB.order_status,
    razorpayOrderId: orderDB.razorpay_order_id || undefined,
    razorpayPaymentId: orderDB.razorpay_payment_id || undefined,
    createdAt: orderDB.created_at || new Date().toISOString(),
    items
  };
}

// Check and seed default dishes in Supabase automatically if empty
async function seedSupabaseMenuIfNeeded(supabase: any) {
  try {
    const { count, error } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.warn('[Supabase Seeder] table "menu_items" might not exist yet or connection issue:', error.message);
      return;
    }

    if (count === 0) {
      console.log('[Supabase Seeder] "menu_items" table is empty. Auto-seeding 5-star menu catalogues...');
      const dbRows = MENU_ITEMS.map(mapMenuItemToDB);
      const { error: insertError } = await supabase
        .from('menu_items')
        .insert(dbRows);
      
      if (insertError) {
        console.error('[Supabase Seeder] Failed to seed default culinary dishes:', insertError);
      } else {
        console.log('[Supabase Seeder] Seeding successful! Production catalog online.');
      }
    }
  } catch (err) {
    console.error('[Supabase Seeder] Unexpected helper error during menu validation:', err);
  }
}

// Database helper proxies
async function fetchMenuFromSupabase(supabase: any): Promise<MenuItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('[Supabase] fetchMenu query error:', error.message);
      return null;
    }
    return (data || []).map(mapDBToMenuItem);
  } catch (err) {
    console.error('[Supabase] fetchMenu exception:', err);
    return null;
  }
}

async function fetchOrdersFromSupabase(supabase: any): Promise<Order[] | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          custom_instructions,
          menu_item_id,
          menu_items (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] fetchOrders query error:', error.message);
      return null;
    }
    return (data || []).map(mapDBOrderWithItemsToOrder);
  } catch (err) {
    console.error('[Supabase] fetchOrders exception:', err);
    return null;
  }
}

async function fetchOrderByIdFromSupabase(supabase: any, id: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          custom_instructions,
          menu_item_id,
          menu_items (*)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`[Supabase] fetchOrderById (${id}) query error:`, error.message);
      return null;
    }
    return data ? mapDBOrderWithItemsToOrder(data) : null;
  } catch (err) {
    console.error(`[Supabase] fetchOrderById (${id}) exception:`, err);
    return null;
  }
}

async function saveOrderToSupabase(supabase: any, order: Order): Promise<boolean> {
  try {
    // 1. Insert core order entry
    const orderDB = {
      id: order.id,
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      customer_phone: order.customerPhone,
      delivery_address: order.deliveryAddress,
      subtotal: order.subtotal,
      gst: order.gst,
      delivery_fee: order.deliveryFee,
      total: order.total,
      payment_status: order.paymentStatus,
      order_status: order.orderStatus,
      razorpay_order_id: order.razorpayOrderId || null,
      razorpay_payment_id: order.razorpayPaymentId || null,
      created_at: order.createdAt
    };

    const { error: orderErr } = await supabase
      .from('orders')
      .insert([orderDB]);

    if (orderErr) {
      console.error('[Supabase] saveOrder order insert failed:', orderErr.message);
      return false;
    }

    // 2. Insert order items
    const itemsDB = order.items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menuItem.id,
      quantity: item.quantity,
      custom_instructions: item.customInstructions || null
    }));

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(itemsDB);

    if (itemsErr) {
      console.error('[Supabase] saveOrder items insert failed:', itemsErr.message);
      // Suppress full transaction atomicity error but log it
      return true;
    }

    return true;
  } catch (err) {
    console.error('[Supabase] saveOrder exception:', err);
    return false;
  }
}

async function updateOrderStatusInSupabase(supabase: any, orderId: string, orderStatus?: string, paymentStatus?: string): Promise<boolean> {
  try {
    const updateData: any = {};
    if (orderStatus) updateData.order_status = orderStatus;
    if (paymentStatus) updateData.payment_status = paymentStatus;

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      console.error(`[Supabase] updateOrderStatus (${orderId}) status insert failed:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Supabase] updateOrderStatus (${orderId}) exception:`, err);
    return false;
  }
}

// ---------------------------------------------------------------

// Helper to progress active orders automatically
const startOrderStatusSimulator = (orderId: string) => {
  // Timer to step through order statuses
  const progressionTimeouts = [
    { status: 'preparing' as const, delay: 12000 },       // after 12s, prepare
    { status: 'out_for_delivery' as const, delay: 28000 }, // after 28s, out for delivery
    { status: 'delivered' as const, delay: 50000 }        // after 50s, delivered
  ];

  progressionTimeouts.forEach(({ status, delay }) => {
    setTimeout(async () => {
      const supabase = getSupabaseClient();
      if (supabase) {
        const order = await fetchOrderByIdFromSupabase(supabase, orderId);
        if (order && order.paymentStatus === 'completed' && order.orderStatus !== 'delivered') {
          const success = await updateOrderStatusInSupabase(supabase, orderId, status);
          if (success) {
            console.log(`[Simulator-Supabase] Order ${orderId} is now ${status} (persisted in Supabase)`);
            return;
          }
        }
      }

      const ordersList = getOrdersFromDB();
      const orderIdx = ordersList.findIndex(o => o.id === orderId);
      if (orderIdx !== -1) {
        const order = ordersList[orderIdx];
        if (order.paymentStatus === 'completed' && order.orderStatus !== 'delivered') {
          ordersList[orderIdx].orderStatus = status;
          saveOrdersToDB(ordersList);
          console.log(`[Simulator-Local] Order ${orderId} is now ${status} (persisted in DB)`);
        }
      }
    }, delay);
  });
};

const app = reportMissingConfigInConsole();

// Support JSON and urlencode parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API: Get Menu
app.get('/api/menu', async (req, res) => {
  const supabase = getSupabaseClient();
  if (supabase) {
    const menu = await fetchMenuFromSupabase(supabase);
    if (menu) {
      return res.json(menu);
    }
  }
  res.json(getMenuFromDB());
});

  // API: Checkout & Create Razorpay Order Simulator
  app.post('/api/checkout', async (req, res) => {
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

    const supabase = getSupabaseClient();
    if (supabase) {
      const success = await saveOrderToSupabase(supabase, newOrder);
      if (success) {
        return res.status(201).json({
          success: true,
          orderId,
          razorpayOrderId,
          amount: total * 100, // in paise
          currency: 'INR'
        });
      }
      console.warn('[Supabase] Failed to insert order. Falling back gracefully to local database file.');
    }

    const currentOrders = getOrdersFromDB();
    currentOrders.push(newOrder);
    saveOrdersToDB(currentOrders);

    res.status(201).json({
      success: true,
      orderId,
      razorpayOrderId,
      amount: total * 100, // in paise
      currency: 'INR'
    });
  });

  // API: Verify Razorpay Payment Simulator
  app.post('/api/verify-payment', async (req, res) => {
    const { orderId, razorpayPaymentId, razorpayOrderId, status } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId' });
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      const finalPaymentStatus = status === 'failed' ? 'failed' : 'completed';
      const finalOrderStatus = status === 'failed' ? 'placed' : 'placed';
      const finalPaymentId = status === 'failed' ? null : (razorpayPaymentId || `pay_${Math.random().toString(36).substring(2, 11)}`);

      const success = await supabase
        .from('orders')
        .update({
          payment_status: finalPaymentStatus,
          order_status: finalOrderStatus,
          razorpay_payment_id: finalPaymentId
        })
        .eq('id', orderId);

      if (!success.error) {
        console.log(`[Supabase] Payment Verified for Order ${orderId}. Launching live-monitoring active process.`);
        startOrderStatusSimulator(orderId);
        
        const order = await fetchOrderByIdFromSupabase(supabase, orderId);
        return res.json({
          success: true,
          order: order || { id: orderId }
        });
      }
      console.warn('[Supabase] Failed to verify payment. Falling back gracefully to local database file.');
    }

    const currentOrders = getOrdersFromDB();
    const orderIndex = currentOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (status === 'failed') {
      currentOrders[orderIndex].paymentStatus = 'failed';
      saveOrdersToDB(currentOrders);
      return res.json({ success: false, message: 'Payment failed' });
    }

    // Update order status to paid and placed
    currentOrders[orderIndex].paymentStatus = 'completed';
    currentOrders[orderIndex].orderStatus = 'placed';
    currentOrders[orderIndex].razorpayPaymentId = razorpayPaymentId || `pay_${Math.random().toString(36).substring(2, 11)}`;

    saveOrdersToDB(currentOrders);

    console.log(`[Server] Payment Verified for Order ${orderId}. Starting real-time tracking simulation.`);
    
    // Start active real-time status progression simulator
    startOrderStatusSimulator(orderId);

    res.json({
      success: true,
      order: currentOrders[orderIndex]
    });
  });

  // API: Get Order tracking status
  app.get('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    
    const supabase = getSupabaseClient();
    if (supabase) {
      const order = await fetchOrderByIdFromSupabase(supabase, id);
      if (order) {
        return res.json(order);
      }
    }

    const currentOrders = getOrdersFromDB();
    const order = currentOrders.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  });

  // API: Get Admin Orders with pagination, search, and status filters
  app.get('/api/admin/orders', async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const search = (req.query.search as string || '').toLowerCase();
    const status = req.query.status as string || 'all';

    let filteredOrders: Order[] = [];
    
    const supabase = getSupabaseClient();
    if (supabase) {
      const spOrders = await fetchOrdersFromSupabase(supabase);
      if (spOrders) {
        filteredOrders = spOrders;
      } else {
        filteredOrders = [...getOrdersFromDB()];
      }
    } else {
      filteredOrders = [...getOrdersFromDB()];
    }

    // Sort by createdAt descending
    filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (search) {
      filteredOrders = filteredOrders.filter(o => 
        o.id.toLowerCase().includes(search) ||
        o.customerName.toLowerCase().includes(search) ||
        o.customerEmail.toLowerCase().includes(search) ||
        (o.customerPhone && o.customerPhone.toLowerCase().includes(search)) ||
        o.deliveryAddress.toLowerCase().includes(search)
      );
    }

    if (status !== 'all') {
      filteredOrders = filteredOrders.filter(o => o.orderStatus === status || o.paymentStatus === status);
    }

    const total = filteredOrders.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    res.json({
      orders: paginatedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  });

  // API: Update order status manually
  app.patch('/api/admin/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const supabase = getSupabaseClient();
    if (supabase) {
      const success = await updateOrderStatusInSupabase(supabase, id, orderStatus, paymentStatus);
      if (success) {
        const order = await fetchOrderByIdFromSupabase(supabase, id);
        return res.json({ success: true, order });
      }
      console.warn('[Supabase] Failed to manually update status, trying file fallback.');
    }

    const currentOrders = getOrdersFromDB();
    const orderIndex = currentOrders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (orderStatus) {
      currentOrders[orderIndex].orderStatus = orderStatus;
    }
    if (paymentStatus) {
      currentOrders[orderIndex].paymentStatus = paymentStatus;
    }

    saveOrdersToDB(currentOrders);
    res.json({ success: true, order: currentOrders[orderIndex] });
  });

  // API: Get Admin Metrics with analytics calculations
  app.get('/api/admin/metrics', async (req, res) => {
    let currentOrders: Order[] = [];
    
    const supabase = getSupabaseClient();
    if (supabase) {
      const spOrders = await fetchOrdersFromSupabase(supabase);
      if (spOrders) {
        currentOrders = spOrders;
      } else {
        currentOrders = getOrdersFromDB();
      }
    } else {
      currentOrders = getOrdersFromDB();
    }

    const completedOrders = currentOrders.filter(o => o.paymentStatus === 'completed');
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

  // Supabase Schema Endpoint
  app.get('/api/supabase-schema', (req, res) => {
    const ddl = `
-- BITECRAFT CLOUD KITCHEN - POSTGRESQL SCHEMA WITH CORE TABLES
-- Use this schema script inside your production database manager.

CREATE TYPE item_category AS ENUM ('starters', 'mains', 'desserts', 'beverages', 'combos');
CREATE TYPE order_status AS ENUM ('placed', 'preparing', 'out_for_delivery', 'delivered');
CREATE TYPE payment_status_type AS ENUM ('pending', 'completed', 'failed');

CREATE TABLE public.menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price INT NOT NULL,
    category TEXT NOT NULL,
    image TEXT,
    video TEXT,
    is_veg BOOLEAN DEFAULT TRUE NOT NULL,
    rating NUMERIC(3,2) DEFAULT 4.5 NOT NULL,
    is_popular BOOLEAN DEFAULT FALSE,
    preparation_time INT DEFAULT 15,
    calories INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    delivery_address TEXT NOT NULL,
    subtotal INT NOT NULL,
    gst INT NOT NULL,
    delivery_fee INT NOT NULL,
    total INT NOT NULL,
    payment_status TEXT DEFAULT 'pending' NOT NULL,
    order_status TEXT DEFAULT 'placed' NOT NULL,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    menu_item_id TEXT REFERENCES public.menu_items(id) NOT NULL,
    quantity INT NOT NULL,
    custom_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
    `;
    res.type('text/plain').send(ddl);
  });

async function startLocalServer() {
  const PORT = 3000;

  // Serve static UI assets and handle spa route fallback in production
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`BiteCraft Server running on host http://0.0.0.0:${PORT}`);
    });
  }
}

function reportMissingConfigInConsole() {
  const app = express();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('--------------------------------------------------');
    console.log('👉 [Note] SUPABASE_URL and SUPABASE_ANON_KEY not configured yet.');
    console.log('👉 Velvet Kitchen is running fully in Safe Fallback Local Database mode.');
    console.log('👉 You can add these keys via the Secrets panel to active real-time cloud persistence.');
    console.log('--------------------------------------------------');
  }
  return app;
}

if (!process.env.VERCEL) {
  startLocalServer();
}

export default app;
