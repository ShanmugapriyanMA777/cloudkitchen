import React, { useState } from 'react';
import { Star, Clock, Flame, Plus, Minus, Check, MessageSquare, Play, X } from 'lucide-react';
import { MenuItem } from '../types';
import { useCartStore } from '../store/cartStore';

interface MenuCardProps {
  item: MenuItem;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item }) => {
  const { items, addItem, updateQuantity } = useCartStore();
  const [instructions, setInstructions] = useState('');
  const [showInstructionsForm, setShowInstructionsForm] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const cartItem = items.find((i) => i.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    addItem(item, 1, instructions);
    setInstructions('');
    setShowInstructionsForm(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleIncrement = () => {
    updateQuantity(item.id, quantity + 1);
  };

  const handleDecrement = () => {
    updateQuantity(item.id, quantity - 1);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#0a0a0a] hover:bg-white/[0.05] transition-all duration-300 hover:shadow-2xl hover:shadow-orange-950/15 hover:-translate-y-1">
      {/* Popular/Best Seller Badge */}
      {item.isPopular && (
        <span className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest bg-orange-600 text-white shadow-md shadow-orange-900/20">
          Best Seller
        </span>
      )}

      {/* Veg / Non-Veg Indicator */}
      <span className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-zinc-950/85 border border-white/10 shadow-md flex items-center justify-center">
        <span className={`h-3 w-3 rounded-sm border-2 flex items-center justify-center ${
          item.isVeg ? 'border-green-600 bg-green-950/20' : 'border-red-650 bg-red-950/20'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${
            item.isVeg ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </span>
      </span>

      {/* Food Image */}
      <div className="relative h-48 w-full overflow-hidden bg-zinc-900/50">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        {/* Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Floating Prep Video Button */}
        {item.video && (
          <button
            id={`watch-prep-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowVideoModal(true);
            }}
            className="absolute bottom-3 right-3 z-10 flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-zinc-950/85 border border-white/10 hover:border-orange-500/50 hover:bg-orange-600 hover:text-white text-[10px] font-mono font-bold uppercase tracking-wider text-orange-500 transition-all shadow-md active:scale-95 duration-200 cursor-pointer"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>Watch Recipes</span>
          </button>
        )}
      </div>

      {/* Specs bar (Prep time, rating, calories) */}
      <div className="flex items-center justify-between px-5 pt-4 text-[11px] font-medium text-zinc-400 border-b border-white/5 pb-3">
        {/* Rating */}
        <div className="flex items-center space-x-1 font-mono font-bold text-orange-500">
          <Star className="w-3.5 h-3.5 fill-current animate-pulse" />
          <span>{item.rating}</span>
        </div>

        {/* Cook Time */}
        <div className="flex items-center space-x-1 font-mono">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>{item.preparationTime} mins</span>
        </div>

        {/* Calories */}
        {item.calories && (
          <div className="flex items-center space-x-0.5 font-mono">
            <Flame className="w-3.5 h-3.5 text-orange-550 text-orange-500" />
            <span>{item.calories} kcal</span>
          </div>
        )}
      </div>

      {/* Content wrapper */}
      <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
        <div className="space-y-1.5">
          <h3 className="font-serif italic text-base font-medium text-white group-hover:text-orange-500 transition-colors">
            {item.name}
          </h3>
          <p className="text-xs text-zinc-400 font-light leading-normal line-clamp-2">
            {item.description}
          </p>
        </div>

        <div className="pt-2 border-t border-dashed border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-lg font-mono font-bold text-white tracking-tight">
              ₹{item.price}
            </span>

            {quantity > 0 ? (
              <div className="flex items-center space-x-2.5 bg-orange-600/10 border border-orange-500/20 px-2.5 py-1 rounded-full text-white">
                <button
                  id={`decrement-${item.id}`}
                  onClick={handleDecrement}
                  className="p-1 rounded-full text-orange-400 hover:text-white hover:bg-orange-600/20 active:scale-90 transition-all duration-150 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-xs font-bold w-4 text-center">
                  {quantity}
                </span>
                <button
                  id={`increment-${item.id}`}
                  onClick={handleIncrement}
                  className="p-1 rounded-full text-orange-400 hover:text-white hover:bg-orange-600/20 active:scale-90 transition-all duration-150 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                {/* Note Toggle Button */}
                <button
                  id={`toggle-instructions-${item.id}`}
                  onClick={() => setShowInstructionsForm(!showInstructionsForm)}
                  className={`p-2 rounded-xl border transition-all active:scale-95 duration-200 cursor-pointer ${
                    showInstructionsForm 
                      ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' 
                      : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Add direct customization instructions"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>

                {/* Main Add Button */}
                <button
                  id={`add-to-cart-${item.id}`}
                  onClick={handleAdd}
                  className={`flex items-center space-x-1 px-4.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer ${
                    justAdded 
                      ? 'bg-emerald-600 text-white font-mono' 
                      : 'bg-white hover:bg-orange-600 hover:text-white text-zinc-950 font-sans'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 animate-bounce" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Order</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Instructions Input Overlay if toggled */}
          {showInstructionsForm && quantity === 0 && (
            <div className="mt-4 p-3 rounded-2xl border border-dashed border-white/5 bg-white/[0.01]">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Cooking instructions
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="E.g., Make it extra spicy, cooked rare, etc."
                className="w-full text-xs p-2 rounded-xl border border-white/10 bg-[#05055] bg-[#050505] text-zinc-200 outline-none focus:border-orange-500 resize-none h-14 font-light"
                maxLength={100}
              />
              <div className="flex justify-end space-x-1 mt-2">
                <button
                  id={`cancel-instructions-${item.id}`}
                  onClick={() => {
                    setInstructions('');
                    setShowInstructionsForm(false);
                  }}
                  className="text-[10px] font-semibold px-2.5 py-1 text-zinc-500 hover:text-zinc-300 Cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id={`save-instructions-${item.id}`}
                  onClick={() => setShowInstructionsForm(false)}
                  className="bg-white/5 text-[10px] font-semibold px-2.5 py-1 rounded-lg text-zinc-350 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </div>
          )}

          {/* Cooking instruction display when in cart */}
          {cartItem?.customInstructions && (
            <div className="mt-3 py-1.5 px-3 rounded-xl bg-orange-950/15 border border-orange-500/10 text-[10px] text-orange-400 font-medium font-mono">
              Note: "{cartItem.customInstructions}"
            </div>
          )}
        </div>
      </div>

      {/* Cooking Video Modal Overlays */}
      {showVideoModal && item.video && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur clickoff */}
          <div 
            onClick={() => setShowVideoModal(false)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md transition-all duration-300"
          />

          {/* Video Player Shell */}
          <div className="relative w-full max-w-lg bg-[#0C0C0C] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header bar */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/40">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-widest">
                  Gourmet Kitchen Prep Loop
                </span>
              </div>
              <button
                id={`close-video-${item.id}`}
                onClick={() => setShowVideoModal(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video content container of exact Aspect Ratio */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                src={item.video}
                autoPlay
                loop
                controls
                className="w-full h-full object-cover"
                playsInline
              />
            </div>

            {/* Visual Description label */}
            <div className="p-5 space-y-2">
              <h3 className="font-serif italic font-medium text-base text-white">
                {item.name}
              </h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Watch our five-star chef's assembly process. Every ingredient is mindfully sourced, tossed, and crafted in a sanitized, thermal-sealed environment for ultimate kitchen fresh delivery.
              </p>
            </div>

            {/* Footer stamp */}
            <div className="bg-[#050505] p-3 border-t border-white/5 text-center">
              <span className="text-[9px] text-zinc-500 font-mono">
                BiteCraft Kitchens • Authenticated HD Culinary Feed
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
