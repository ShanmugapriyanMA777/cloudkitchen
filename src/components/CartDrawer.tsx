import React, { useState } from 'react';
import { X, ShoppingBag, Trash2, ArrowRight, MessageSquare, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onCheckout }) => {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    setInstructions,
    getSubtotal, 
    getGST, 
    getDeliveryFee, 
    getTotal 
  } = useCartStore();

  const [editingInstructionsId, setEditingInstructionsId] = useState<string | null>(null);
  const [tempInstructions, setTempInstructions] = useState('');

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const gst = getGST();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  const freeDeliveryThreshold = 499;
  const awayFromFreeDelivery = freeDeliveryThreshold - subtotal;
  const deliveryProgressPercent = Math.min((subtotal / freeDeliveryThreshold) * 100, 100);

  const handleSaveInstructions = (itemId: string) => {
    setInstructions(itemId, tempInstructions);
    setEditingInstructionsId(null);
    setTempInstructions('');
  };

  const handleStartEditingInstructions = (itemId: string, currentInstructions = '') => {
    setEditingInstructionsId(itemId);
    setTempInstructions(currentInstructions);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      {/* Backdrop Overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/80 w-full h-full backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        {/* Panel Slider Drawer container */}
        <div className="w-screen max-w-md bg-[#0A0A0A] shadow-2xl flex flex-col h-full border-l border-white/5 transition-all duration-300 transform translate-x-0">
          
          {/* Drawer Header */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#050505]/40 animate-fade-in">
            <div className="flex items-center space-x-2.5">
              <ShoppingBag className="w-5 h-5 text-orange-500 animate-pulse" />
              <h2 className="text-sm font-sans font-bold text-[#F5F5F5]">
                Your Culinary Cart ({items.reduce((acc, item) => acc + item.quantity, 0)})
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto py-4 px-5 no-scrollbar">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="w-20 h-20 rounded-full bg-orange-650/10 flex items-center justify-center text-orange-500">
                  <ShoppingBag className="w-10 h-10 stroke-1" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif italic text-[#F5F5F5] text-base">Your cart is empty</h3>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto font-light leading-relaxed">
                    Add aromatic starters, mains, or decadent meal combos to satisfy your cravings.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-orange-600 hover:bg-orange-500 text-white transition-all cursor-pointer"
                >
                  Indulge Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Free Delivery progress bar */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/[0.03] to-orange-500/[0.08] border border-orange-500/10">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-zinc-300 font-light">
                      {awayFromFreeDelivery > 0 ? (
                        <>Add <span className="font-mono font-bold text-orange-500">₹{awayFromFreeDelivery}</span> more for free delivery</>
                      ) : (
                        <span className="text-emerald-500 font-mono font-bold">🎉 Free Delivery Unlocked!</span>
                      )}
                    </span>
                    {awayFromFreeDelivery > 0 && (
                      <span className="text-[10px] text-zinc-500 font-mono">Goes to ₹499</span>
                    )}
                  </div>
                  <div className="w-full bg-[#050505] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${deliveryProgressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-white/5">
                  {items.map((item) => (
                    <div key={item.id} className="py-4 flex flex-col space-y-2.5">
                      <div className="flex items-start space-x-3.5">
                        {/* Food Thumb */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-900/50 flex-shrink-0 border border-white/5">
                          <img 
                            src={item.menuItem.image} 
                            alt={item.menuItem.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Middle info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-serif italic text-white line-clamp-1 leading-tight pr-1">
                              {item.menuItem.name}
                            </h4>
                            <span className="text-sm font-mono font-bold text-orange-450 text-orange-400 ml-2">
                              ₹{item.menuItem.price * item.quantity}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            ₹{item.menuItem.price} each
                          </p>
                        </div>
                      </div>

                      {/* Row of subactions */}
                      <div className="flex items-center justify-between pt-1">
                        {/* Note controller */}
                        <div className="flex items-center">
                          {editingInstructionsId === item.id ? (
                            <div className="flex items-center space-x-1.5 w-full">
                              <input
                                type="text"
                                value={tempInstructions}
                                onChange={(e) => setTempInstructions(e.target.value)}
                                placeholder="E.g., No mushrooms..."
                                className="w-40 text-xs py-1 px-2.5 rounded-lg border border-white/10 bg-[#050505] text-zinc-200 outline-none focus:border-orange-500/50 font-light"
                                maxLength={80}
                              />
                              <button
                                onClick={() => handleSaveInstructions(item.id)}
                                className="text-[10px] font-semibold px-2.5 py-1 rounded bg-orange-650 bg-orange-600 hover:bg-orange-500 text-white cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEditingInstructions(item.id, item.customInstructions)}
                              className="flex items-center space-x-1 text-[10px] font-semibold text-zinc-500 hover:text-orange-500 transition-colors cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{item.customInstructions ? 'Edit instruction' : 'Write cooking note'}</span>
                            </button>
                          )}
                        </div>

                        {/* Quantity Counter & Delete combo */}
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center bg-[#050505] border border-white/5 rounded-lg p-0.5">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-white cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-mono font-bold text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-white cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 rounded-lg border border-white/5 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {item.customInstructions && editingInstructionsId !== item.id && (
                        <span className="mt-1.5 self-start px-2.5 py-1 rounded bg-orange-950/15 text-[10px] border border-orange-500/15 text-orange-400 font-mono font-semibold block max-w-full truncate">
                          Note: "{item.customInstructions}"
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer calculations */}
          {items.length > 0 && (
            <div className="border-t border-white/5 bg-[#050505] pb-6 pt-5 px-5 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-450 text-zinc-450 text-zinc-400">
                  <span>Subtotal (Item Total)</span>
                  <span className="font-mono font-bold text-zinc-200">₹{subtotal}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center space-x-1">
                    <span>GST (Kitchen Tax 5%)</span>
                  </div>
                  <span className="font-mono font-bold text-zinc-200">₹{gst}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Delivery Partner Fee</span>
                  <span className="font-mono font-bold text-zinc-200">
                    {deliveryFee === 0 ? <span className="text-emerald-500 font-bold uppercase tracking-wide text-[10px]">FREE</span> : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="border-t border-dashed border-white/10 pt-3 flex items-center justify-between font-serif italic text-[#F5F5F5] text-base">
                  <span>Total Amount</span>
                  <span className="font-mono not-italic font-bold text-orange-400 text-lg">₹{total}</span>
                </div>
              </div>

              <button
                id="checkout-proceed-btn"
                onClick={onCheckout}
                className="w-full h-12 flex items-center justify-between px-5 rounded-full bg-orange-600 hover:bg-orange-500 text-white font-semibold uppercase tracking-wider text-xs transition-all duration-300 shadow-lg shadow-orange-950/20 cursor-pointer group"
              >
                <span>Proceed to Checkout</span>
                <span className="flex items-center space-x-1 font-mono">
                  <span>₹{total}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
