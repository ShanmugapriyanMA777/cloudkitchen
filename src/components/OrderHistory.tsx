import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Mail, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Utensils, 
  DollarSign, 
  ShieldCheck, 
  ShoppingBag,
  Loader2
} from 'lucide-react';
import { Order } from '../types';

interface OrderHistoryProps {
  onOrderUpdated?: () => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ onOrderUpdated }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination, search, and filter states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [limit] = useState(5);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Local state for tracking which orders are expanded
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Tracking intermediate status transitions
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async (targetPage = page, querySearch = search, filter = statusFilter) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: limit.toString(),
        search: querySearch,
        status: filter
      });

      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Administrative database read-node connection interrupted.');
      }
      const data = await response.json();
      setOrders(data.orders || []);
      setTotalPages(data.pagination.totalPages || 1);
      setTotalOrders(data.pagination.total || 0);
    } catch (err: any) {
      setError(err.message || 'An error occurred while retrieving order records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page, search, statusFilter);
  }, [page]);

  // Handle live search changes with debounce helper (optional) or simple immediate execute
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders(1, search, statusFilter);
  };

  const handleFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter);
    setPage(1);
    fetchOrders(1, search, newFilter);
  };

  const handleStatusChange = async (orderId: string, newOrderStatus: string) => {
    try {
      setUpdatingId(orderId);
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newOrderStatus })
      });

      if (!response.ok) {
        throw new Error('Sync patch fault: order status failed to write.');
      }
      
      // Update local state without losing expand context
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: newOrderStatus as any } : o));
      
      // Force trigger metrics refresh in parent if available
      if (onOrderUpdated) {
        onOrderUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Error updating order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  const getOrderStatusBadgeClass = (status: Order['orderStatus']) => {
    switch (status) {
      case 'placed':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'preparing':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 animate-pulse';
      case 'out_for_delivery':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      case 'delivered':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      default:
        return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400';
    }
  };

  const getPaymentStatusBadgeClass = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'pending':
        return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'failed':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      default:
        return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400';
    }
  };

  const formatOrderTime = (isoString?: string) => {
    if (!isoString) return 'Unrecorded time';
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="rounded-[2.2rem] border border-white/5 bg-[#0a0a0a] p-5 sm:p-7 space-y-6 hover:border-white/10 transition-all duration-300">
      
      {/* Top action block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-orange-600/10 text-orange-500 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h3 className="text-base font-serif italic font-medium text-white">Live Culinary Order Registry</h3>
          </div>
          <p className="text-[10px] text-zinc-400 font-light mt-1">
            Search, filter, track status progressions, and review customer recipes securely.
          </p>
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-1 bg-[#050505] p-1 rounded-xl border border-white/5">
          {[
            { id: 'all', label: 'All Jobs' },
            { id: 'placed', label: 'Placed' },
            { id: 'preparing', label: 'Preparing' },
            { id: 'out_for_delivery', label: 'Out' },
            { id: 'delivered', label: 'Delivered' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleFilterChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-orange-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Widget */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by customer name, email, transaction phone or order reference ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#050505] text-xs h-10 pl-10 pr-4 rounded-xl border border-white/5 focus:border-orange-500/50 outline-none text-zinc-200 font-light placeholder:text-zinc-600"
          />
        </div>
        <button
          type="submit"
          className="px-4 h-10 rounded-xl bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider hover:bg-orange-600 hover:text-white transition-all active:scale-95 duration-150 cursor-pointer"
        >
          Query
        </button>
        <button
          type="button"
          onClick={() => {
            setSearch('');
            setStatusFilter('all');
            setPage(1);
            fetchOrders(1, '', 'all');
          }}
          className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 text-zinc-400 hover:text-white transition-all cursor-pointer"
          title="Reset filter"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </form>

      {/* Orders list container */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span className="text-xs text-zinc-400 font-light font-mono animate-pulse">Syncing order datastore...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-red-500/5 text-xs text-red-400 border border-red-500/10 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Error loading registry: {error}</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
          <Utensils className="w-10 h-10 text-zinc-700 mx-auto" strokeWidth={1} />
          <h4 className="font-serif italic text-sm text-zinc-400 mt-3.5">No matching logs processed</h4>
          <p className="text-[10px] text-zinc-500 mt-1.5 font-light">Please verify credentials or try another filter status category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <div 
                key={order.id}
                className="rounded-2xl border border-white/5 bg-[#050505] p-4.5 sm:p-5 transition-all hover:border-white/10"
              >
                {/* Header summary row */}
                <div 
                  onClick={() => toggleExpandOrder(order.id)}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-orange-400 tracking-tight">{order.id}</span>
                      <span className="text-[9px] font-mono bg-white/5 border border-white/5 text-zinc-400 px-2 py-0.5 rounded">
                        {order.items.reduce((sum, i) => sum + i.quantity, 0)} Items
                      </span>
                      <span className="text-xs text-zinc-500 font-light font-mono">• {formatOrderTime(order.createdAt)}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-serif italic text-white font-medium">{order.customerName}</span>
                      <span className="text-zinc-500 text-[10px] font-light font-mono">({order.customerEmail})</span>
                    </div>
                  </div>

                  {/* Statuses and action expand indicators */}
                  <div className="flex items-center gap-3 self-start md:self-center">
                    <div className="flex flex-col items-end gap-1.5 text-right">
                      <div className="flex gap-1.5">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${getOrderStatusBadgeClass(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                          Pay: {order.paymentStatus}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-white leading-none">₹{order.total}</span>
                    </div>

                    <div className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Collapsible layout */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-dashed border-white/5 space-y-6 animate-fade-in">
                    
                    {/* Grid split: Customer Info vs Order Items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: Customer Specs */}
                      <div className="space-y-3.5 p-4 rounded-xl bg-white/[0.01] border border-white/5">
                        <span className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest leading-none">
                          Customer Coordinates
                        </span>
                        
                        <div className="space-y-3 font-light text-xs text-zinc-350">
                          <div className="flex items-center space-x-2.5">
                            <User className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                            <span>Name: <strong className="text-white font-medium">{order.customerName}</strong></span>
                          </div>

                          <div className="flex items-center space-x-2.5">
                            <Mail className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                            <span>Email: <a href={`mailto:${order.customerEmail}`} className="text-orange-400 hover:underline">{order.customerEmail}</a></span>
                          </div>

                          {order.customerPhone && (
                            <div className="flex items-center space-x-2.5">
                              <Phone className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                              <span>Phone: <span className="text-zinc-200 font-mono font-semibold">{order.customerPhone}</span></span>
                            </div>
                          )}

                          <div className="flex items-start space-x-2.5 pt-1.5 border-t border-white/5 mt-1.5">
                            <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <span className="block text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider">Delivery Destination</span>
                              <p className="leading-relaxed text-zinc-300">{order.deliveryAddress}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Items Purchased */}
                      <div className="space-y-3.5">
                        <span className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest leading-none">
                          Dishes Selected ({order.items.length})
                        </span>

                        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex items-start gap-3">
                              <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                                <img 
                                  src={item.menuItem.image} 
                                  alt={item.menuItem.name} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between text-xs">
                                  <h5 className="font-serif italic text-white truncate pr-1">{item.menuItem.name}</h5>
                                  <span className="font-mono text-zinc-400 text-[10px] flex-shrink-0 font-bold">
                                    {item.quantity}x • ₹{item.menuItem.price * item.quantity}
                                  </span>
                                </div>
                                
                                {item.customInstructions && (
                                  <div className="mt-1 pb-0.5 text-[9px] text-orange-400 font-mono italic">
                                    Note: "{item.customInstructions}"
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order financials */}
                        <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/5 text-[10px] space-y-1.5 font-light">
                          <div className="flex items-center justify-between text-zinc-500">
                            <span>Subtotal:</span>
                            <span className="font-mono w-20 text-right">₹{order.subtotal}</span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-500">
                            <span>GST (5% tax):</span>
                            <span className="font-mono w-20 text-right">₹{order.gst}</span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-500 pb-1.5 border-b border-[#111]">
                            <span>Delivery charge:</span>
                            <span className="font-mono w-20 text-right">
                              {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between font-mono font-bold text-xs text-white pt-1">
                            <span>Final Total:</span>
                            <span className="text-orange-500 text-sm">₹{order.total}</span>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Order Action Status progression panel */}
                    <div className="p-4 rounded-xl border border-orange-500/10 bg-orange-600/[0.01] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-1">
                        <span className="block text-[10px] font-mono font-bold text-orange-400 uppercase tracking-widest leading-none">
                          Modify Dispatch Progression
                        </span>
                        <p className="text-[10px] text-zinc-400 font-light leading-normal">
                          Step this order through the status pipeline manually. Customers track this status directly on their terminals.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {updatingId === order.id && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                        )}
                        <select
                          disabled={updatingId === order.id}
                          value={order.orderStatus}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="h-9 px-3 text-xs bg-zinc-950 rounded-lg border border-white/10 text-white outline-none focus:border-orange-500 transition-colors disabled:opacity-50 font-semibold cursor-pointer"
                        >
                          <option value="placed">Placed (Pending Chef)</option>
                          <option value="preparing">Preparing (Cooking)</option>
                          <option value="out_for_delivery">Out for Delivery (Dispatched)</option>
                          <option value="delivered">Delivered (Completed)</option>
                        </select>
                      </div>
                    </div>

                    {/* Razorpay specific fields */}
                    {(order.razorpayOrderId || order.razorpayPaymentId) && (
                      <div className="font-mono text-[9px] text-zinc-500 leading-normal flex flex-wrap gap-x-4 border-t border-dashed border-[#111] pt-3 pl-1">
                        {order.razorpayOrderId && <span>RAZORPAY ORDER: {order.razorpayOrderId}</span>}
                        {order.razorpayPaymentId && <span>PAYMENT REF: {order.razorpayPaymentId}</span>}
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination control block */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/5 pt-5 select-none">
          <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-widest">
            Log total: {totalOrders} Records
          </span>

          <div className="flex items-center space-x-1 font-mono">
            <button
              onClick={() => {
                if (page > 1) setPage(page - 1);
              }}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/5 text-zinc-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`min-w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    page === pageNum
                      ? 'bg-orange-600 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => {
                if (page < totalPages) setPage(page + 1);
              }}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/5 text-zinc-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
