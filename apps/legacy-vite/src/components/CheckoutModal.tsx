import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, DollarSign, Wand2, Package, CheckCircle } from 'lucide-react';
import { User } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  user: User;
  onCheckoutSuccess: (remainingPoints: number) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, product, user, onCheckoutSuccess }) => {
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');
  const [useWallet, setUseWallet] = useState(true);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  
  if (!isOpen || !product) return null;

  const maxDiscountAllowed = product.price * 0.90;
  const userPoints = user.points || 0;
  const discountApplied = useWallet ? Math.min(maxDiscountAllowed, userPoints) : 0;
  const finalPrice = product.price - discountApplied;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId: product._id,
          useWallet,
          deliveryAddress: { street, city, zip, country }
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onCheckoutSuccess(data.pointsRemaining);
          onClose();
          setSuccess(false);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if(!success) setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-lg p-6 bg-neutral-950 border border-amber-900/50 shadow-2xl rounded-3xl relative overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-amber-500 hover:text-amber-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {success ? (
              <div className="text-center space-y-4 py-8">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
                <h2 className="text-2xl font-bold text-amber-100 font-serif">Order Conjured Successfully!</h2>
                <p className="text-sm text-amber-200/70">The owl is on its way with your {product.name}.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center text-black">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-amber-100 font-serif">Apothecary Checkout</h2>
                    <p className="text-sm text-amber-200/70">Review and finalize your magical order.</p>
                  </div>
                </div>

                <div className="p-4 bg-black/40 rounded-2xl border border-amber-900/30 flex gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/60 border border-amber-900/40 shrink-0">
                    {product.imageBase64 && <img src={product.imageBase64} alt="product" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex flex-col justify-center flex-1">
                    <h3 className="font-bold text-amber-100">{product.name}</h3>
                    <p className="text-sm text-emerald-400 font-bold">₹{product.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="p-4 bg-amber-900/10 rounded-2xl border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-amber-200/70">Original Price</span>
                    <span className="font-bold text-amber-100">₹{product.price.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={useWallet} 
                        onChange={(e) => setUseWallet(e.target.checked)}
                        className="w-4 h-4 rounded border-amber-500/30 text-amber-500 focus:ring-amber-500/50 bg-black/40"
                      />
                      <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
                        <Wand2 className="w-3 h-3"/> Use House Points ({userPoints} available)
                      </span>
                    </label>
                    <span className="font-bold text-red-400">-₹{discountApplied.toFixed(2)}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-amber-900/30 flex items-center justify-between">
                    <span className="font-bold text-amber-100">Final Price</span>
                    <span className="text-xl font-bold text-emerald-400">₹{finalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <form onSubmit={handleCheckout} className="space-y-4">
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 border-b border-amber-900/30 pb-2">
                    <MapPin className="w-4 h-4" /> Delivery Owl Destination
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input required value={street} onChange={e=>setStreet(e.target.value)} placeholder="Street / P.O. Box" className="col-span-2 bg-black/40 border border-amber-900/30 rounded-xl px-4 py-2.5 text-amber-100 text-sm focus:outline-none focus:border-amber-500" />
                    <input required value={city} onChange={e=>setCity(e.target.value)} placeholder="City / Town" className="bg-black/40 border border-amber-900/30 rounded-xl px-4 py-2.5 text-amber-100 text-sm focus:outline-none focus:border-amber-500" />
                    <input required value={zip} onChange={e=>setZip(e.target.value)} placeholder="Zip Code" className="bg-black/40 border border-amber-900/30 rounded-xl px-4 py-2.5 text-amber-100 text-sm focus:outline-none focus:border-amber-500" />
                    <input required value={country} onChange={e=>setCountry(e.target.value)} placeholder="Country" className="col-span-2 bg-black/40 border border-amber-900/30 rounded-xl px-4 py-2.5 text-amber-100 text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isProcessing}
                    className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing Enchantment...' : `Pay ₹${finalPrice.toFixed(2)} & Complete Order`}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
