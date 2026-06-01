import React, { useState } from 'react';
import { Star, Clock, Flame, Plus, Minus, Check, MessageSquare } from 'lucide-react';
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

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between p-5">
        <div>
          <h3 className="font-serif italic font-medium text-lg text-white tracking-tight leading-tight mb-1.5 group-hover:text-orange-500 transition-colors">
            {item.name}
          </h3>
          <p className="text-xs text-zinc-450 text-zinc-400 leading-relaxed mb-4 line-clamp-2 font-light">
            {item.description}
          </p>
        </div>

        <div>
          {/* Price & Action Row */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-500">Price</span>
              <span className="text-lg font-mono font-bold text-white">
                ₹{item.price}
              </span>
            </div>

            {/* Selector Button Controller */}
            {quantity === 0 ? (
              <div className="flex items-center space-x-1">
                {/* Note Indicator */}
                <button
                  onClick={() => setShowInstructionsForm(!showInstructionsForm)}
                  className={`p-2 rounded-xl border transition-colors ${
                    showInstructionsForm || instructions
                      ? 'bg-orange-950/30 border-orange-500/30 text-orange-500'
                      : 'text-zinc-500 border-white/10 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                  title="Add Cooking Note"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  onClick={handleAdd}
                  className="flex items-center justify-center space-x-1.5 px-4.5 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase bg-orange-600 hover:bg-orange-500 text-white transition-all active:scale-95 duration-200 shadow-md shadow-orange-950/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center bg-orange-600 rounded-xl text-white p-0.5 shadow-md shadow-orange-950/20">
                <button
                  onClick={handleDecrement}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-xs font-mono font-bold">{quantity}</span>
                <button
                  onClick={handleIncrement}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
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
                placeholder="E.g., Make it extra spicy, no onions, etc."
                className="w-full text-xs p-2 rounded-xl border border-white/10 bg-[#050505] text-zinc-200 outline-none focus:border-orange-500 resize-none h-14 font-light"
                maxLength={100}
              />
              <div className="flex justify-end space-x-1 mt-2">
                <button
                  onClick={() => {
                    setInstructions('');
                    setShowInstructionsForm(false);
                  }}
                  className="text-[10px] font-semibold px-2.5 py-1 text-zinc-500 hover:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowInstructionsForm(false)}
                  className="bg-white/5 text-[10px] font-semibold px-2.5 py-1 rounded-lg text-zinc-350 hover:bg-white/10 hover:text-white"
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
    </div>
  );
};
