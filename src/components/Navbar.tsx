import React from 'react';
import { ShoppingBag, Moon, Sun, ShieldAlert, ChefHat } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

interface NavbarProps {
  isAdminView: boolean;
  setIsAdminView: (v: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (d: boolean) => void;
  onOpenCart: () => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAdminView,
  setIsAdminView,
  isDarkMode,
  setIsDarkMode,
  onOpenCart,
  activeCategory,
  setActiveCategory
}) => {
  const cartItems = useCartStore((state) => state.items);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const categories = [
    { id: 'all', label: 'All Cuisines' },
    { id: 'starters', label: 'Starters' },
    { id: 'mains', label: 'Mains' },
    { id: 'desserts', label: 'Desserts' },
    { id: 'beverages', label: 'Beverages' },
    { id: 'combos', label: 'Combos' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-all duration-300 border-white/5 bg-[#050505]/85">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            onClick={() => setIsAdminView(false)} 
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-900/20 group-hover:scale-110 transition-transform duration-300">
              <ChefHat className="w-5 h-5" />
            </div>
            <span className="text-xl font-serif italic font-medium text-white tracking-wide">
              BiteCraft<span className="font-sans not-italic font-black text-orange-500 ml-0.5">Kitchen</span>
            </span>
          </div>

          {/* Desktop Right items */}
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <button
              id="admin-view-toggle"
              onClick={() => setIsAdminView(!isAdminView)}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold tracking-wide rounded-full transition-all duration-300 border ${
                isAdminView 
                  ? 'bg-orange-950/30 text-orange-400 border-orange-500/20' 
                  : 'bg-white/5 text-zinc-300 border-white/5 hover:bg-white/10'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isAdminView ? 'Admin Dashboard' : 'Customer Mode'}</span>
            </button>

            {/* Dark Mode button */}
            <button
              id="dark-mode-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors"
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-orange-500" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Cart Button */}
            {!isAdminView && (
              <button
                id="cart-trigger"
                onClick={onOpenCart}
                className="relative flex items-center justify-center p-2.5 rounded-xl border border-white/10 hover:border-orange-500/30 hover:bg-orange-500/5 text-zinc-300 hover:text-orange-500 transition-all duration-300"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-mono font-bold text-white shadow-sm ring-2 ring-[#050505] animate-bounce">
                    {totalItems}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar (Available in Customer Mode Only) */}
        {!isAdminView && (
          <div className="flex items-center space-x-2 py-3 overflow-x-auto no-scrollbar border-t border-dashed border-white/5">
            {categories.map((cat) => (
              <button
                id={`cat-btn-${cat.id}`}
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/40'
                    : 'bg-white/5 border border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
