import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Package, Sparkles, IndianRupee, ExternalLink, Activity } from 'lucide-react';
import { User } from '../types';
import { CheckoutModal } from './CheckoutModal';

interface ApothecaryProps {
  user: User;
  onUpdatePoints: (points: number) => void;
}

export const Apothecary: React.FC<ApothecaryProps> = ({ user, onUpdatePoints }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [targetedConditions, setTargetedConditions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetch('/api/recommendations', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (data.success) {
          setProducts(data.products);
          setTargetedConditions(data.targetedConditions || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-amber-900/30">
        <div>
          <h1 className="text-3xl font-extrabold text-amber-100 flex items-center gap-3">
            <Package className="w-8 h-8 text-amber-400" />
            <span>The Apothecary</span>
          </h1>
          <p className="text-sm text-amber-200/70 mt-1 font-sans">
            Magical remedies and potions recommended by your latest Prophecy Orb scan.
          </p>
        </div>
        <div className="bg-black/40 px-5 py-2.5 rounded-full border border-amber-500/30 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-amber-100 font-sans tracking-wide">
            House Points: <span className="text-amber-400">{user.points || 0}</span>
          </span>
        </div>
      </div>

      {targetedConditions.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-wrap items-center gap-3">
          <Activity className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-bold text-amber-100">Potions tailored for your aura:</span>
          {targetedConditions.map(cond => (
            <span key={cond} className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold font-sans">
              {cond}
            </span>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, i) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-3xl glass-panel-magical flex flex-col justify-between group"
            >
              <div>
                <div className="w-full h-48 rounded-xl overflow-hidden bg-black/40 border border-amber-900/30 mb-4 relative">
                  {product.imageBase64 ? (
                    <img src={product.imageBase64} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-amber-900"><Package className="w-12 h-12" /></div>
                  )}
                  {product.targetHealthConditions?.[0] && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/30">
                      <span className="text-[10px] text-amber-400 font-bold uppercase">{product.targetHealthConditions[0]}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-amber-100 font-serif">{product.name}</h3>
                <p className="text-xs text-amber-200/70 mt-2 line-clamp-3 leading-relaxed font-sans">{product.description}</p>
                {product.aiReason && (
                  <div className="mt-3 p-3 bg-amber-900/20 border border-amber-500/30 rounded-xl">
                    <p className="text-[10px] font-bold text-amber-400 flex items-center gap-1 mb-1"><Sparkles className="w-3 h-3" /> AI Recommendation</p>
                    <p className="text-xs text-amber-100/90 font-sans italic">"{product.aiReason}"</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-amber-900/30 flex items-center justify-between">
                <span className="text-2xl font-bold text-emerald-400 flex items-center gap-1 font-mono">
                  <IndianRupee className="w-5 h-5"/>{product.price}
                </span>
                <button
                  onClick={() => setSelectedProduct(product)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-900/20 flex items-center gap-2"
                >
                  Conjure <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}

          {products.length === 0 && (
            <div className="col-span-full py-20 text-center glass-panel-magical rounded-3xl border border-amber-900/20">
              <Package className="w-16 h-16 text-amber-900 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-100 font-serif">Apothecary Empty</h2>
              <p className="text-amber-200/60 mt-2 font-sans">No magical remedies are currently available.</p>
            </div>
          )}
        </div>
      )}

      <CheckoutModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        user={user}
        onCheckoutSuccess={(points) => {
          onUpdatePoints(points);
        }}
      />
    </div>
  );
};
