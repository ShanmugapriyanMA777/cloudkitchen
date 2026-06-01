import React, { useState, useEffect, useRef } from 'react';
import { Clock, MapPin, Phone, ChefHat, CheckSquare, Bike, ThumbsUp, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Order } from '../types';

interface OrderTrackerProps {
  orderId: string;
  onBackToMenu: () => void;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({ orderId, onBackToMenu }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eta, setEta] = useState(25); // initial simulated minutes ETA

  // Use ref to clear interval on unmount
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrderStatus = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Unable to find transaction state.');
      }
      const data = await response.json();
      setOrder(data);
      setError(null);

      // Adjust ETA based on status for realism
      if (data.orderStatus === 'placed') setEta(25);
      else if (data.orderStatus === 'preparing') setEta(18);
      else if (data.orderStatus === 'out_for_delivery') setEta(8);
      else if (data.orderStatus === 'delivered') setEta(0);

    } catch (err: any) {
      setError(err.message || 'Error syncing status from kitchen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderStatus();

    // Poll status every 4 seconds for immediate feedback in workspace
    timerRef.current = setInterval(() => {
      fetchOrderStatus();
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <h3 className="font-serif italic text-lg text-white">Connecting to kitchen dashboard...</h3>
        <p className="text-xs text-zinc-400 font-light">Verifying secure payment and registering order ticket.</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-orange-655/10 bg-orange-950/20 border border-orange-500/10 flex items-center justify-center text-orange-500">
          <MapPin className="w-8 h-8" />
        </div>
        <h3 className="font-serif italic text-lg text-white">Oops! Tracker desynchronized</h3>
        <p className="text-xs text-zinc-400 max-w-sm font-light leading-relaxed">
          {error || 'The requested order reference does not exist on this node.'}
        </p>
        <button
          onClick={onBackToMenu}
          className="px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-orange-600 hover:bg-orange-500 text-white transition-all cursor-pointer"
        >
          Back to Cuisines
        </button>
      </div>
    );
  }

  const getStatusStepIndex = () => {
    switch (order.orderStatus) {
      case 'placed': return 1;
      case 'preparing': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      default: return 1;
    }
  };

  const statusIndex = getStatusStepIndex();

  const stages = [
    { id: 1, label: 'Order Confirmed', description: 'Payment verified, kitchen assigned', icon: CheckSquare },
    { id: 2, label: 'Gourmet Preparing', description: 'Chef is hand-crafting meals', icon: ChefHat },
    { id: 3, label: 'Out for Delivery', description: 'Rider is zooming to your street', icon: Bike },
    { id: 4, label: 'Delivered', description: 'Enjoy your Velvet meals!', icon: ThumbsUp }
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 space-y-6 text-[#F5F5F5]">
      
      {/* Tracker Hero card */}
      <div className="rounded-[2rem] border border-white/5 bg-[#0a0a0a] backdrop-blur-xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        
        {/* Live Satellite status display */}
        <div className="absolute top-4 right-4 flex items-center space-x-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/15 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-wider">
            {stages[statusIndex - 1].label}
          </span>
        </div>

        {/* ETA Header */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 font-bold">Estimated Delivery Time</span>
          <div className="flex items-baseline space-x-1">
            <h2 className="text-4xl font-mono font-bold text-white tracking-tight leading-none">
              {order.orderStatus === 'delivered' ? 'ARRIVED!' : `${eta}`}
            </h2>
            {order.orderStatus !== 'delivered' && (
              <span className="text-xs font-mono font-bold text-zinc-400">MINS</span>
            )}
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm font-light mt-1.5">
            {order.orderStatus === 'delivered' ? (
              <span className="text-emerald-400 font-medium">Your premium meal box has been safely hand-delivered at your doorstep!</span>
            ) : (
              'We prepare, package, and deliver under premium temperature control to protect flavor integrity.'
            )}
          </p>
        </div>

        {/* Dynamic Linear Progress Bar */}
        <div className="mt-8 relative">
          <div className="absolute top-4 left-0 right-0 h-1 bg-[#050505] rounded-full">
            <div 
              className="h-full bg-orange-600 rounded-full transition-all duration-1000" 
              style={{ width: `${((statusIndex - 1) / (stages.length - 1)) * 100}%` }}
            />
          </div>

          <div className="relative flex justify-between">
            {stages.map((stage) => {
              const StageIcon = stage.icon;
              const isCurrent = statusIndex === stage.id;
              const isCompleted = statusIndex >= stage.id;

              return (
                <div key={stage.id} className="flex flex-col items-center text-center space-y-2 select-none group">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border duration-500 relative z-10 ${
                    isCurrent 
                      ? 'bg-orange-600 text-white border-orange-500 scale-110 shadow-lg shadow-orange-950/30' 
                      : isCompleted
                      ? 'bg-[#050505] text-orange-450 border-orange-600/50 text-orange-400'
                      : 'bg-[#050505] text-zinc-650 border-white/5 text-zinc-600'
                  }`}>
                    <StageIcon className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-wider hidden sm:block ${
                    isCurrent ? 'text-orange-500' : isCompleted ? 'text-zinc-300' : 'text-zinc-600'
                  }`}>
                    {stage.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {stageSpecificCard(order.orderStatus, order.customerName)}

      {/* Order Summary & Receipt details */}
      <div className="rounded-[2rem] border border-white/5 bg-[#0a0a0a] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 bg-[#050505]/40 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#555] text-zinc-500">Order Information</h3>
            <p className="text-xs font-mono font-bold text-orange-400 mt-0.5">{order.id}</p>
          </div>
          <button
            onClick={fetchOrderStatus}
            className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-orange-500 transition-colors cursor-pointer"
            title="Force status sync"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Deliver to address */}
          <div className="flex items-start space-x-3 text-xs">
            <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-0.5 flex-1">
              <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500">DELIVER TO</p>
              <p className="text-zinc-300 font-light leading-relaxed">{order.deliveryAddress}</p>
            </div>
          </div>

          <div className="border-t border-dashed border-white/10 pt-3.5 space-y-2.5">
            <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-zinc-500 block mb-2">Item Breakdown</span>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">
                  <span className="font-mono font-bold text-orange-500 pr-1">{item.quantity}×</span> {item.menuItem.name}
                  {item.customInstructions && (
                    <span className="block text-[10px] text-orange-400 font-mono font-medium italic">"{item.customInstructions}"</span>
                  )}
                </span>
                <span className="font-mono font-bold text-white ml-3">₹{item.menuItem.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-white/10 pt-3.5 text-xs flex justify-between font-bold text-[#F5F5F5] leading-none">
            <span>Amount Paid Securely</span>
            <span className="font-mono text-orange-405 text-orange-400">₹{order.total}</span>
          </div>
        </div>

        <div className="bg-[#050505] px-5 py-4 flex items-center justify-between border-t border-white/5">
          <p className="text-[9px] text-zinc-550 text-zinc-500 font-mono">SimPayment Reference: {order.razorpayPaymentId || 'N/A'}</p>
          <button
            onClick={onBackToMenu}
            className="text-xs font-semibold text-orange-500 hover:text-white transition-colors cursor-pointer"
          >
            Order Something Else
          </button>
        </div>
      </div>

    </div>
  );
};

// Generates specific visual illustrations or mock avatars according to active index status
function stageSpecificCard(status: string, customerName: string) {
  switch (status) {
    case 'placed':
      return (
        <div className="p-4 rounded-3xl border border-white/5 bg-[#0a0a0a] flex items-center space-x-4 animate-pulse">
          <div className="w-10 h-10 rounded-2xl bg-orange-950/30 border border-orange-500/20 flex items-center justify-center text-orange-500 flex-shrink-0 animate-bounce">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-serif italic text-white text-sm">Registering Order Ticket</h4>
            <p className="text-[10px] text-zinc-405 text-zinc-400 leading-relaxed mt-0.5">Our kitchen team is printing your meal ticket. Chef will begin cooking shortly!</p>
          </div>
        </div>
      );
    case 'preparing':
      return (
        <div className="p-4 rounded-3xl border border-white/5 bg-[#0a0a0a] flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-950/40 border border-white/10 flex-shrink-0 flex items-center justify-center text-lg shadow-inner">
            🧑‍🍳
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-serif italic text-white text-sm">Chef Vikram Kumar cooking</h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed mt-0.5 font-light">
              Hand-tasting and assembling under 100% strict hygiene protocols. Cooking with wood-fired ovens.
            </p>
          </div>
        </div>
      );
    case 'out_for_delivery':
      return (
        <div className="p-4 rounded-3xl border border-white/5 bg-[#0a0a0a] flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-950/40 border border-white/10 flex-shrink-0 flex items-center justify-center text-lg shadow-inner">
              🚴
            </div>
            <div>
              <h4 className="text-xs font-serif italic text-white text-sm">Rider Rahul Sharma</h4>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Vaccinated Partner • 4.9 Rating⭐</p>
            </div>
          </div>
          <a
            href="tel:+919999999999"
            className="p-2 border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
            title="Call delivery partner"
          >
            <Phone className="w-4 h-4 text-orange-500" />
          </a>
        </div>
      );
    case 'delivered':
      return (
        <div className="p-5 rounded-3xl border border-dashed border-emerald-500/20 bg-emerald-500/[0.02] flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xl shadow-lg">
              🌟
            </div>
            <div>
              <h4 className="text-sm font-serif italic text-[#F5F5F5] text-base">Ready to Feast, {customerName}!</h4>
              <p className="text-[11px] text-zinc-400 leading-normal mt-0.5 font-light">Your premium insulated bag has arrived. Please rate your dining experience.</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 mt-3 sm:mt-0">
            <span className="text-[9px] font-mono font-bold text-orange-550 text-orange-400 bg-orange-500/10 border border-orange-500/10 px-3 py-1.5 rounded-full flex items-center">
              <Sparkles className="w-3 h-3 mr-1 fill-current text-orange-500" />
              +50 points earned
            </span>
          </div>
        </div>
      );
    default:
      return null;
  }
}
