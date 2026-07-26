import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Lock, User as UserIcon, Calendar, Activity, X } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (user: User) => void;
  role: 'patient' | 'doctor' | 'client';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthenticate, role }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!email || !password || (!isLogin && (!name || !age))) {
      setAuthError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { email, password } 
        : { email, password, name, age: parseInt(age), role };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      localStorage.setItem('token', data.token);
      onAuthenticate({
        id: data.user.id || data.user._id,
        name: data.user.name,
        email: data.user.email,
        age: data.user.age,
        role: data.user.role,
        avatar: role === 'doctor' 
          ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80'
          : role === 'client'
          ? 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=200&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      });
      onClose();
    } catch (err: any) {
      setAuthError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const activeColorClass = role === 'doctor' 
    ? 'from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 shadow-teal-500/25'
    : role === 'client'
    ? 'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/25'
    : 'from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/25';

  const iconBgClass = role === 'doctor'
    ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
    : role === 'client'
    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';

  const focusBorderClass = role === 'doctor'
    ? 'focus:border-teal-500'
    : role === 'client'
    ? 'focus:border-amber-500'
    : 'focus:border-indigo-500';

  const textHighlightClass = role === 'doctor'
    ? 'text-teal-400'
    : role === 'client'
    ? 'text-amber-400'
    : 'text-indigo-400';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md p-8 bg-neutral-950 border border-white/10 shadow-2xl rounded-3xl relative"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-1.5 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center mb-8">
              <div className={`p-4 rounded-2xl border ${iconBgClass} mb-4`}>
                <Activity className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {isLogin ? `${role === 'doctor' ? 'Doctor' : 'Patient'} Sign In` : `Create ${role === 'doctor' ? 'Doctor' : 'Patient'} Account`}
              </h2>
              <p className="text-sm text-neutral-400 mt-2 text-center">
                {isLogin 
                  ? `Access the ${role === 'doctor' ? 'Clinical Console' : 'Health Dashboard'}` 
                  : `Register to begin tracking ${role === 'doctor' ? 'clinical metrics' : 'facial vitals'}`}
              </p>
            </div>

            {authError && (
              <div className="p-3 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:outline-none ${focusBorderClass} transition-colors placeholder:text-neutral-600`}
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-neutral-500" />
                    <input
                      type="number"
                      placeholder="Age"
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:outline-none ${focusBorderClass} transition-colors placeholder:text-neutral-600`}
                    />
                  </div>
                </>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-neutral-500" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:outline-none ${focusBorderClass} transition-colors placeholder:text-neutral-600`}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-neutral-500" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:outline-none ${focusBorderClass} transition-colors placeholder:text-neutral-600`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r ${activeColorClass} text-white text-sm font-bold shadow-lg transition-all disabled:opacity-50`}
              >
                {isSubmitting ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setAuthError('');
                }}
                className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
              >
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span className={`${textHighlightClass} font-bold`}>{isLogin ? 'Sign up' : 'Sign in'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
