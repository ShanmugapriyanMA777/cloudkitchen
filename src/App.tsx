import React, { useState, useEffect } from 'react';
import { ChefHat, ShoppingBag, MapPin, Sparkles, AlertCircle, TrendingUp, Compass, Heart, Loader2 } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { MenuCard } from './components/MenuCard';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutForm } from './components/CheckoutForm';
import { OrderTracker } from './components/OrderTracker';
import { AdminDashboard } from './components/AdminDashboard';
import { MenuItem } from './types';

export default function App() {
  // Navigation & View States
  const [isAdminView, setIsAdminView] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // Styling theme mode
  const [isDarkMode, setIsDarkMode] = useState(true); // default to dark mode for a premium night culinary aesthetic

  // Drawer & Overlay Dialog Controllers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Menu items list state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  // Handle HTML document body theme class synchronization
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load menu items from server on startup
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoadingMenu(true);
        const res = await fetch('/api/menu');
        if (!res.ok) throw new Error('Failed to retrieve fresh menu catalogue.');
        const data = await res.json();
        setMenuItems(data);
      } catch (err: any) {
        setMenuError(err.message || 'Error parsing menu items');
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchMenu();
  }, []);

  // Filter products by category
  const filteredMenuItems = menuItems.filter(item => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const featuredItems = menuItems.filter(item => item.isPopular).slice(0, 3);

  // Callback triggers when order placement succeeds
  const handleCheckoutSuccess = (orderId: string) => {
    setIsCheckoutOpen(false);
    setActiveOrderId(orderId);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] font-sans selection:bg-orange-600/35 transition-colors duration-300">
      
      {/* Sticky Header Nav */}
      <Navbar
        isAdminView={isAdminView}
        setIsAdminView={setIsAdminView}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onOpenCart={() => setIsCartOpen(true)}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {/* Primary Layout Router Switch */}
      {isAdminView ? (
        <AdminDashboard onBackToMenu={() => setIsAdminView(false)} />
      ) : activeOrderId ? (
        <main className="py-6 whitespace-normal">
          <OrderTracker 
            orderId={activeOrderId} 
            onBackToMenu={() => setActiveOrderId(null)} 
          />
        </main>
      ) : (
        <main className="whitespace-normal pb-16">
          {/* Brand Presentation HERO BANNER Section */}
          <section className="relative overflow-hidden py-16 sm:py-24 border-b border-white/5 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-900/40 via-[#050505] to-[#050505]">
            {/* Ambient vector halos */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-orange-600/10 blur-[110px] pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl space-y-6">
                
                {/* Visual Label Tag */}
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-orange-500 tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="font-sans text-xs text-zinc-400 tracking-wider">Michelin-grade Hygiene Certifications Approved</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-serif italic font-medium tracking-tight leading-[1.08] text-white">
                  Mindfully Prepared.<br/>
                  <span className="text-orange-500 font-sans not-italic font-black">Hand-Crafted</span> Cuisines.
                </h1>

                <p className="text-sm sm:text-base leading-relaxed text-zinc-400 max-w-2xl font-light">
                  Velvet Kitchen is a highly optimized, premium cloud kitchen environment competing with five-star global diners. We source organic, local farm ingredients to forge slow-cooked gourmet delicacies, packaged in thermal-insulated boxes and dispatched instantly.
                </p>

                {/* Micro-Features Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-3 max-w-xl">
                  {[
                    { label: 'Sourdough Sourced', desc: 'No chemical yeast triggers' },
                    { label: 'Zero-Contact Logistics', desc: 'Dispatched under thermal seal' },
                    { label: 'Truffle-Grade Spicery', desc: 'Ground and crushed on-order' }
                  ].map((f, idx) => (
                    <div key={idx} className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xs">
                      <span className="block text-[11px] font-mono font-bold uppercase text-orange-500 tracking-widest leading-none">{f.label}</span>
                      <span className="block text-[10px] text-zinc-400 mt-1">{f.desc}</span>
                    </div>
                  ))}
                </div>

                {/* Hero CTA anchors */}
                <div className="flex items-center space-x-3.5 pt-4">
                  <a
                    href="#menu-catalogue"
                    className="px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider bg-orange-600 text-white transition-all hover:bg-orange-500 hover:scale-102 shadow-lg shadow-orange-950/20 active:scale-95 duration-200 cursor-pointer"
                  >
                    Indulge In Cuisines
                  </a>
                  <button
                    onClick={() => {
                      const id = prompt('Enter Order Ref (e.g. ord-123):');
                      if (id && id.trim()) {
                        setActiveOrderId(id.trim());
                      }
                    }}
                    className="px-5 py-3 rounded-full text-xs font-semibold uppercase tracking-wider border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 transition-all active:scale-95 duration-200"
                  >
                    Track Live Position
                  </button>
                </div>

              </div>
            </div>
          </section>

          {/* Featured Dishes Spotlights */}
          {featuredItems.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-serif italic text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-1.5 text-orange-500" />
                    BiteCraft Featured Chef Masterpieces
                  </h2>
                  <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider font-mono">Most endorsed recipes by our elite gastronomer circles this season</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredItems.map((item) => (
                  <div key={item.id} className="relative rounded-3xl overflow-hidden border border-white/5 bg-white/[0.02]/30 bg-[#0A0A0A] hover:bg-white/[0.05] transition-all flex p-3.5 space-x-4 items-center group">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-orange-400 flex items-center">
                        <Heart className="w-2.5 h-2.5 mr-0.5 fill-current text-orange-500" />
                        Critically Endorsed
                      </span>
                      <h3 className="font-serif italic text-sm tracking-tight text-white line-clamp-1 mt-0.5 leading-tight">{item.name}</h3>
                      <p className="text-[10px] text-zinc-400 font-mono mt-1">₹{item.price} • Rated {item.rating}⭐</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Core Menu Grid Section */}
          <section id="menu-catalogue" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 scroll-mt-20">
            <div className="border-t border-white/5 border-dashed pt-8 mb-8 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2.5">
              <div>
                <h2 className="text-2xl font-serif italic text-[#F5F5F5] flex items-center">
                  <Compass className="w-5.5 h-5.5 mr-1.5 text-orange-500" />
                  Explore our Cuisine Collections
                </h2>
                <p className="text-xs text-zinc-400 mt-1">Select from five distinct categories designed around modern dietary palettes.</p>
              </div>

              {/* Counts Indicator */}
              <span className="text-xs font-mono font-bold text-zinc-300 bg-white/5 border border-white/5 px-4 py-1.5 rounded-full self-start">
                Showing {filteredMenuItems.length} Dishes
              </span>
            </div>

            {/* Error States */}
            {menuError && (
              <div className="p-4 rounded-2xl bg-red-500/5 text-xs text-red-400 border border-red-500/10 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Error Loading Menu: {menuError}</span>
              </div>
            )}

            {/* Loading Grid Spinner */}
            {loadingMenu ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-72 rounded-3xl border border-white/5 bg-[#0A0A0A] p-5 flex flex-col justify-between animate-pulse">
                    <div className="w-full h-36 rounded-2xl bg-white/5" />
                    <div className="space-y-2.5 mt-4">
                      <div className="h-4 w-2/3 bg-white/5 rounded" />
                      <div className="h-3 w-5/6 bg-white/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMenuItems.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                <ChefHat className="w-12 h-12 text-zinc-600 mx-auto" strokeWidth={1} />
                <h3 className="font-serif italic text-base text-zinc-300 mt-4">No matching entrees found</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">We are actively baking and restocking. Please try switching filters or choosing another category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMenuItems.map((item) => (
                  <MenuCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {/* Persistent slide-out shopping cart sidebar drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Multi-step safe Order Checkout and Razorpay payments popup drawer */}
      <CheckoutForm
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />

    </div>
  );
}
