import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, ShieldCheck, CreditCard, Landmark, Wallet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import confetti from 'canvas-confetti';

interface CheckoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const { items, getSubtotal, getGST, getDeliveryFee, getTotal, clearCart } = useCartStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    streetAddress: '',
    apartment: '',
    pinCode: '',
    city: 'New Delhi'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  
  // Simulated payment state
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const gst = getGST();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  const validateStep1 = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Email is invalid';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      errs.phone = 'Please enter a valid 10-digit phone number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.streetAddress.trim()) errs.streetAddress = 'Delivery address is required';
    if (!formData.pinCode.trim()) {
      errs.pinCode = 'PIN Code is required';
    } else if (!/^\d{6}$/.test(formData.pinCode)) {
      errs.pinCode = 'Please enter a valid 6-digit PIN Code';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) {
        initiateSimulatedCheckout();
      }
    }
  };

  const handlePrevStep = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  // Initiates checkout on backend and gets razorpay order ID
  const initiateSimulatedCheckout = async () => {
    setLoading(true);
    setPaymentError(null);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerName: formData.fullName,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          deliveryAddress: `${formData.apartment ? formData.apartment + ', ' : ''}${formData.streetAddress}, ${formData.city} - ${formData.pinCode}`,
          subtotal,
          gst,
          deliveryFee,
          total
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCheckoutOrderId(data.orderId);
        setRazorpayOrderId(data.razorpayOrderId);
        setStep(3);
      } else {
        setPaymentError(data.error || 'Failed to initialize payment gateway.');
      }
    } catch (err) {
      setPaymentError('Network error. Failed to reach order server.');
    } finally {
      setLoading(false);
    }
  };

  // Triggers frontend Razorpay modal pop-up simulation
  const handleOpenPaymentGateway = () => {
    setShowRazorpayModal(true);
  };

  const handleCompletePayment = async (simulateSuccess: boolean) => {
    setLoading(true);
    setShowRazorpayModal(false);
    setPaymentError(null);

    // Give it a realistic processing delay
    setTimeout(async () => {
      try {
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: checkoutOrderId,
            razorpayOrderId: razorpayOrderId,
            status: simulateSuccess ? 'completed' : 'failed',
            razorpayPaymentId: simulateSuccess ? `pay_rzp_${Math.random().toString(36).substring(2, 9)}` : null
          })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          // Play sound and confetti!
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });

          // Clear Zustand store cart
          clearCart();
          onSuccess(checkoutOrderId || '');
        } else {
          setPaymentError(data.message || 'Razorpay payment confirmation failed or denied.');
        }
      } catch (err) {
        setPaymentError('Verification failed. Unable to authenticate order state.');
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/85 w-full h-full backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Checkout Box Modal details */}
      <div className="relative w-full max-w-2xl bg-[#0A0A0A] rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-300 transform translate-y-0 max-h-[95vh] text-[#F5F5F5]">
        
        {/* Left Side: Dynamic Step Form Panel */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto no-scrollbar">
          
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-orange-500">Checkout Process</span>
                <h2 className="text-xl font-serif italic font-medium text-white tracking-tight">
                  {step === 1 && 'Personal Information'}
                  {step === 2 && 'Delivery Address'}
                  {step === 3 && 'Payment Gateway'}
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white transition-colors md:hidden cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="flex items-center space-x-2 mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 flex items-center">
                  <div className={`h-1 flex-1 rounded-full ${
                    step >= s ? 'bg-orange-600' : 'bg-white/5'
                  }`} />
                </div>
              ))}
            </div>

            {/* ERROR SUMMARY */}
            {paymentError && (
              <div className="mb-5 p-4 rounded-2xl bg-red-550/5 bg-red-950/10 border border-red-500/15 flex items-start space-x-2.5 text-xs text-red-400 font-medium font-sans">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* STEP 1: CONTACT */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="E.g., Aarav Sharma"
                    className={`w-full py-2.5 px-4 text-sm rounded-xl border bg-[#050505] text-white outline-none transition-all font-light ${
                      errors.fullName ? 'border-red-500 ring-1 ring-red-500/50' : 'border-white/10 focus:border-orange-500'
                    }`}
                  />
                  {errors.fullName && <p className="text-[10px] text-red-400 font-semibold">{errors.fullName}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="aarav.sharma@example.com"
                    className={`w-full py-2.5 px-4 text-sm rounded-xl border bg-[#050505] text-white outline-none transition-all font-light ${
                      errors.email ? 'border-red-500 ring-1 ring-red-500/50' : 'border-white/10 focus:border-orange-500'
                    }`}
                  />
                  {errors.email && <p className="text-[10px] text-red-400 font-semibold">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Phone Number (10 digit)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                    maxLength={10}
                    className={`w-full py-2.5 px-4 text-sm rounded-xl border bg-[#050505] text-white outline-none transition-all font-mono font-bold tracking-wide ${
                      errors.phone ? 'border-red-500 ring-1 ring-red-500/50' : 'border-white/10 focus:border-orange-500'
                    }`}
                  />
                  {errors.phone && <p className="text-[10px] text-red-400 font-semibold">{errors.phone}</p>}
                </div>
              </div>
            )}

            {/* STEP 2: ADDRESS */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Street Address / Landmark</label>
                  <input
                    type="text"
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                    placeholder="12, Green Avenue, Behind Connaught Place"
                    className={`w-full py-2.5 px-4 text-sm rounded-xl border bg-[#050505] text-white outline-none transition-all font-light ${
                      errors.streetAddress ? 'border-red-500 ring-1 ring-red-500/50' : 'border-white/10 focus:border-orange-500'
                    }`}
                  />
                  {errors.streetAddress && <p className="text-[10px] text-red-400 font-semibold">{errors.streetAddress}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Apartment / Suite</label>
                    <input
                      type="text"
                      value={formData.apartment}
                      onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                      placeholder="Floor 3A"
                      className="w-full py-2.5 px-4 text-sm rounded-xl border border-white/10 bg-[#050505] text-white outline-none focus:border-orange-500 font-light"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">PIN Code (6 digits)</label>
                    <input
                      type="text"
                      value={formData.pinCode}
                      onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                      maxLength={6}
                      placeholder="110001"
                      className={`w-full py-2.5 px-4 text-sm rounded-xl border bg-[#050505] text-white outline-none transition-all font-mono font-bold ${
                        errors.pinCode ? 'border-red-500 ring-1 ring-red-500/50' : 'border-white/10 focus:border-orange-500'
                      }`}
                    />
                    {errors.pinCode && <p className="text-[10px] text-red-400 font-semibold">{errors.pinCode}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    disabled
                    className="w-full py-2.5 px-4 text-sm rounded-xl border border-white/5 bg-[#050505] text-zinc-500 cursor-not-allowed outline-none font-medium"
                  />
                  <p className="text-[10px] text-zinc-500 font-light leading-snug">Currently servicing select pockets of New Delhi only.</p>
                </div>
              </div>
            )}

            {/* STEP 3: CONFIRM & PAY */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/[0.03] to-orange-500/[0.08] border border-orange-500/15 text-xs text-zinc-300">
                  <h4 className="font-serif italic font-medium text-white text-sm mb-1.5 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1 text-orange-500" />
                    Secure Gateway Registered
                  </h4>
                  <p className="font-light leading-relaxed">
                    OrderId <span className="font-mono font-bold text-orange-400">{razorpayOrderId}</span> has been securely created. Tap below to launch the Razorpay Payment screen.
                  </p>
                </div>

                {/* Simulated Payment Providers Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Select Payment Method</label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'card' as const, label: 'Credit Card', icon: CreditCard },
                      { id: 'upi' as const, label: 'UPI GPay / PhonePe', icon: CheckCircle },
                      { id: 'netbanking' as const, label: 'Indian Banks', icon: Landmark },
                      { id: 'wallet' as const, label: 'Mobile Wallets', icon: Wallet }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setPaymentMethod(item.id)}
                        className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                          paymentMethod === item.id
                            ? 'bg-orange-600 text-white border-orange-500/40 shadow-lg shadow-orange-950/20'
                            : 'bg-white/[0.02] text-zinc-400 border-white/5 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-semibold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="mt-8 flex items-center justify-between pt-4 border-t border-white/5 bg-[#0a0a0a]">
            {step > 1 ? (
              <button
                onClick={handlePrevStep}
                disabled={loading}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full border border-white/10 hover:bg-white/5 text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div /> // Spacer
            )}

            {step < 3 ? (
              <button
                onClick={handleNextStep}
                disabled={loading}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-full bg-orange-600 hover:bg-orange-500 hover:scale-101 text-white text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-md shadow-orange-950/20 active:scale-95 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>{step === 2 ? 'Place Simulated Order' : 'Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                id="pay-now-trigger"
                onClick={handleOpenPaymentGateway}
                disabled={loading}
                className="flex items-center justify-center space-x-1.5 px-6 py-2.5 rounded-full bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-lg shadow-orange-9a5/20 shadow-orange-950/30 active:scale-95 cursor-pointer w-fit"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pay ₹{total} securely</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Order Summary Panel Details */}
        <div className="hidden md:flex w-64 bg-[#050505] p-6 flex-col justify-between border-l border-white/5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">Order Summary</h3>
              <button 
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart items list mini preview */}
            <div className="space-y-4 max-h-[45vh] overflow-y-auto no-scrollbar pb-3 border-b border-white/5">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-xs text-zinc-300">
                  <div className="flex-1 pr-3">
                    <p className="font-serif italic text-white line-clamp-1">{item.menuItem.name}</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Qty {item.quantity} × ₹{item.menuItem.price}</p>
                    {item.customInstructions && (
                      <span className="text-[9px] font-mono font-semibold text-orange-405 text-orange-400 block mt-0.5">"{item.customInstructions}"</span>
                    )}
                  </div>
                  <span className="font-mono font-semibold text-white flex-shrink-0">₹{item.menuItem.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Calculations summaries */}
            <div className="space-y-2.5 pt-4 text-[11px] text-zinc-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono font-bold text-zinc-200">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (Kitchen Tax 5%)</span>
                <span className="font-mono font-bold text-zinc-200">₹{gst}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-mono font-bold text-zinc-200">
                  {deliveryFee === 0 ? <span className="text-emerald-500 font-bold uppercase">FREE</span> : `₹${deliveryFee}`}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 flex flex-col space-y-1">
            <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-zinc-500">Grand Total</span>
            <span className="text-lg font-mono font-bold text-orange-400">₹{total}</span>
          </div>

        </div>

      </div>

      {/* RAZORPAY GATEWAY SIMULATED WINDOW POPUP */}
      {showRazorpayModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/85 w-full h-full backdrop-blur-sm animate-fade-in" />
          <div className="relative w-full max-w-md bg-[#0C0C0C] border border-white/10 text-white rounded-3xl p-6 shadow-2xl flex flex-col space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Branding */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold font-mono">R</div>
                <span className="text-[10px] font-sans font-bold tracking-wider uppercase text-zinc-400">Razorpay Secure</span>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-emerald-400 font-bold">SIMULATOR ACTIVE</span>
            </div>

            {/* Total payable amount */}
            <div className="text-center py-5 bg-black/40 rounded-2xl border border-white/5">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono font-bold">BiteCraft Kitchen Order</p>
              <h3 className="text-3xl font-mono font-bold text-white tracking-tight mt-1">₹{total}.00</h3>
              <p className="text-[10px] text-zinc-400 mt-1 font-mono">Simulated Order: {razorpayOrderId}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wide">Test Transaction Control</h4>
              <p className="text-[11px] text-blue-300 leading-relaxed bg-blue-950/20 p-3 rounded-xl border border-blue-900/10 font-light">
                You are currently inside the sandbox browser preview. Choose how you would like Razorpay core to verify this simulated transaction.
              </p>
            </div>

            {/* Buttons Row */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="rzp-fail-btn"
                onClick={() => handleCompletePayment(false)}
                className="w-full h-11 flex items-center justify-center rounded-xl bg-red-950/30 text-red-500 border border-red-500/10 hover:bg-red-950/50 transition-all duration-200 text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Simulate Failure
              </button>
              <button
                id="rzp-success-btn"
                onClick={() => handleCompletePayment(true)}
                className="w-full h-11 flex items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all active:scale-95 duration-200 text-xs font-semibold uppercase tracking-wider shadow-md shadow-emerald-900/20 cursor-pointer"
              >
                Confirm Payment
              </button>
            </div>

            <div className="text-center pt-1">
              <p className="text-[9px] text-zinc-500 font-light font-mono">By selecting Confirm, Simulated Funds are cleared immediately. Total: ₹{total}</p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
