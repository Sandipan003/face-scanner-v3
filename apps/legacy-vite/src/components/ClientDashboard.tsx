import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Package, Plus, IndianRupee, Activity, Image as ImageIcon } from 'lucide-react';
import { User } from '../types';

interface ClientDashboardProps {
  user: User;
  onLogout: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ user, onLogout }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [targetCondition, setTargetCondition] = useState('High Stress');

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
          imageBase64,
          targetHealthConditions: [targetCondition]
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsAdding(false);
        fetchProducts();
        setName('');
        setDescription('');
        setPrice('');
        setImageBase64('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-amber-100 flex items-center gap-3">
            <Package className="w-8 h-8 text-orange-400 shrink-0" />
            <span>Apothecary Vendor Portal</span>
          </h1>
          <p className="text-sm text-amber-200/70 mt-1">Welcome back, {user.name}. Manage your magical remedies here.</p>
        </div>
        <div className="flex flex-row gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex-1 md:flex-none justify-center px-4 py-3 md:py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl font-bold text-sm hover:bg-amber-500/20 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isAdding ? 'Cancel' : 'Add Potion'}
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-3 md:py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-colors shrink-0"
          >
            Logout
          </button>
        </div>
      </div>

      {isAdding && (
        <motion.form 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleAddProduct}
          className="p-6 rounded-3xl glass-panel-magical space-y-4"
        >
          <h2 className="text-xl font-bold text-amber-100">List New Magical Remedy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1">Product Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/40 border border-amber-900/30 rounded-xl px-4 py-3 text-amber-100 focus:outline-none focus:border-amber-500" placeholder="e.g. Draught of Peace" />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1">Price (₹)</label>
              <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-black/40 border border-amber-900/30 rounded-xl px-4 py-3 text-amber-100 focus:outline-none focus:border-amber-500" placeholder="e.g. 50" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-amber-400 mb-1">Description</label>
              <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-black/40 border border-amber-900/30 rounded-xl px-4 py-3 text-amber-100 focus:outline-none focus:border-amber-500" rows={3} placeholder="Describe the potion's effects..."></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1">Target Health Condition</label>
              <select value={targetCondition} onChange={e => setTargetCondition(e.target.value)} className="w-full bg-black/40 border border-amber-900/30 rounded-xl px-4 py-3 text-amber-100 focus:outline-none focus:border-amber-500">
                <option value="High Stress">High Stress</option>
                <option value="Low HRV">Low HRV (Resonance)</option>
                <option value="Elevated CV Risk">Elevated CV Risk</option>
                <option value="Blood Pressure">Blood Pressure</option>
                <option value="Skincare">Skincare</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1">Product Image</label>
              <input required type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-amber-100/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-amber-500/10 file:text-amber-400 hover:file:bg-amber-500/20" />
            </div>
          </div>
          <button type="submit" className="w-full mt-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all">
            List Product
          </button>
        </motion.form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product._id} className="p-4 rounded-3xl glass-panel-magical flex flex-col justify-between space-y-4">
            <div className="w-full h-48 rounded-xl overflow-hidden bg-black/40 border border-amber-900/30">
              {product.imageBase64 ? (
                <img src={product.imageBase64} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-amber-900"><ImageIcon className="w-12 h-12" /></div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-100">{product.name}</h3>
              <p className="text-xs text-amber-200/70 mt-1 line-clamp-2">{product.description}</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-amber-900/30">
              <span className="text-lg font-bold text-emerald-400 flex items-center gap-1"><IndianRupee className="w-4 h-4"/>{product.price}</span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full border border-amber-500/20">{product.targetHealthConditions[0]}</span>
            </div>
          </div>
        ))}
        
        {products.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-amber-200/50">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Your apothecary shelves are empty.</p>
            <p className="text-sm mt-1">Add some potions to begin selling.</p>
          </div>
        )}
      </div>
    </div>
  );
};
