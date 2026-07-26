import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, Phone, Activity, X, Award, History, Edit3 } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onUpdate: (updatedUser: UserType) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'wallet'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [walletHistory, setWalletHistory] = useState<any[]>([]);
  const [points, setPoints] = useState(user.points || 0);

  // Form State
  const [name, setName] = useState(user.name || '');
  const [age, setAge] = useState(user.age?.toString() || '');
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup || '');
  const [phone, setPhone] = useState(user.phone || '');

  useEffect(() => {
    if (isOpen) {
      setName(user.name || '');
      setAge(user.age?.toString() || '');
      setBloodGroup(user.bloodGroup || '');
      setPhone(user.phone || '');
      setPoints(user.points || 0);
      fetchWalletHistory();
    }
  }, [isOpen, user]);

  const fetchWalletHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/user/wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPoints(data.points);
        setWalletHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch wallet history", err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, age: parseInt(age), bloodGroup, phone })
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }
      
      onUpdate(data.user);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="w-full max-w-lg bg-[#0c0a09] border border-amber-900/50 shadow-[0_0_40px_rgba(245,158,11,0.15)] rounded-3xl relative overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-amber-900/30 flex items-center justify-between bg-black/40">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`text-sm font-bold font-sans tracking-wider uppercase px-4 py-2 rounded-xl transition-colors ${
                    activeTab === 'profile' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'text-amber-200/50 hover:text-amber-200 hover:bg-white/5'
                  }`}
                >
                  Wizard Profile
                </button>
                <button
                  onClick={() => setActiveTab('wallet')}
                  className={`text-sm font-bold font-sans tracking-wider uppercase px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
                    activeTab === 'wallet' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'text-amber-200/50 hover:text-amber-200 hover:bg-white/5'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  House Points
                </button>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-amber-200/50 hover:text-amber-200 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {activeTab === 'profile' ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-serif text-amber-100 font-bold">Identity Registry</h3>
                    {!isEditing && (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 uppercase tracking-wider"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-amber-200/70 uppercase tracking-wider pl-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/50" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={!isEditing}
                          className="w-full bg-black/40 border border-amber-900/30 rounded-xl py-3 pl-12 pr-4 text-amber-100 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-amber-200/70 uppercase tracking-wider pl-1">Age</label>
                        <input
                          type="number"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          disabled={!isEditing}
                          className="w-full bg-black/40 border border-amber-900/30 rounded-xl py-3 px-4 text-amber-100 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-amber-200/70 uppercase tracking-wider pl-1">Blood Group</label>
                        <div className="relative">
                          <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
                          <input
                            type="text"
                            value={bloodGroup}
                            onChange={(e) => setBloodGroup(e.target.value)}
                            disabled={!isEditing}
                            className="w-full bg-black/40 border border-amber-900/30 rounded-xl py-3 pl-10 pr-4 text-amber-100 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-amber-200/70 uppercase tracking-wider pl-1">Scroll Contact (Phone)</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/50" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={!isEditing}
                          className="w-full bg-black/40 border border-amber-900/30 rounded-xl py-3 pl-12 pr-4 text-amber-100 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            // Reset state to user props
                            setName(user.name || '');
                            setAge(user.age?.toString() || '');
                            setBloodGroup(user.bloodGroup || '');
                            setPhone(user.phone || '');
                          }}
                          className="flex-1 py-3 rounded-xl border border-amber-900/50 text-amber-200 hover:bg-amber-900/20 font-bold transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? 'Sealing...' : 'Seal Changes'}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center p-8 glass-panel-magical rounded-[2rem] border border-amber-500/30 bg-gradient-to-b from-amber-900/20 to-black/40">
                    <Award className="w-12 h-12 text-amber-400 mb-4" />
                    <h4 className="text-amber-200/70 text-sm font-bold uppercase tracking-widest mb-1">Total House Points</h4>
                    <span className="text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                      {points}
                    </span>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 text-amber-100 font-bold font-serif text-lg mb-4">
                      <History className="w-5 h-5 text-amber-500" />
                      Magical Ledger
                    </h4>
                    
                    <div className="space-y-3">
                      {walletHistory.length === 0 ? (
                        <div className="text-center p-6 border border-dashed border-amber-900/30 rounded-2xl text-amber-200/50 text-sm">
                          No magical transactions recorded yet. Gaze into the Prophecy Orb to earn points!
                        </div>
                      ) : (
                        walletHistory.map((tx, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-amber-900/20 hover:border-amber-500/30 transition-colors">
                            <div className="flex flex-col">
                              <span className="text-amber-100 font-bold text-sm">{tx.reason || 'Magical Feat'}</span>
                              <span className="text-amber-200/50 text-xs">{new Date(tx.date).toLocaleDateString()} at {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <span className="text-amber-400 font-bold font-mono bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                              +{tx.amount} HP
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
