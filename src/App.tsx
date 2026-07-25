import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Shield, Camera, HeartPulse, ChevronRight, TrendingUp } from 'lucide-react';

import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ContactlessScanner } from './components/ContactlessScanner';
import { Footer } from './components/Footer';

import { User, HealthReport } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [healthReports, setHealthReports] = useState<HealthReport[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Fetch Health Reports from DB
  const fetchHealthReports = async (token: string) => {
    try {
      const res = await fetch('/api/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHealthReports(data.reports);
      }
    } catch (err) {
      console.error('Failed to fetch health reports', err);
    }
  };

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Typically we'd fetch the user profile here, but for simplicity we rely on the token for reports
      // Let's at least try to fetch reports
      fetchHealthReports(token);
    }
  }, []);

  const handleAuthenticate = (userData: User) => {
    setUser(userData);
    const token = localStorage.getItem('token');
    if (token) fetchHealthReports(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setHealthReports([]);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500 selection:text-white flex flex-col relative overflow-x-hidden">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <Navbar 
        user={user} 
        onLoginClick={() => setIsAuthModalOpen(true)} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 z-10">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8"
            >
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <Camera className="w-16 h-16 text-indigo-400" />
              </div>
              <div className="space-y-4 max-w-2xl">
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500">
                  Clinical-Grade Face Scanning
                </h1>
                <p className="text-base sm:text-lg text-neutral-400">
                  Analyze your Heart Rate, Stress, Fatigue, and overall Wellness instantly using your device's camera. Powered by advanced optical rPPG.
                </p>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-lg shadow-2xl shadow-indigo-500/25 transition-all flex items-center gap-3"
              >
                <span>Get Started Now</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Header Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-3xl bg-neutral-900/50 border border-white/10 backdrop-blur-xl flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
                    <HeartPulse className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-neutral-500 block">Total Scans</span>
                    <span className="text-3xl font-extrabold text-white">{healthReports.length}</span>
                  </div>
                </div>
                
                <div className="p-6 rounded-3xl bg-neutral-900/50 border border-white/10 backdrop-blur-xl flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-neutral-500 block">Avg Stress Level</span>
                    <span className="text-xl font-bold text-white">
                      {healthReports.length > 0 ? healthReports[0].vitals.stressLevel : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-neutral-900/50 border border-white/10 backdrop-blur-xl flex items-center gap-4 md:col-span-1">
                  <div className="w-full flex justify-between items-center">
                    <div>
                      <span className="text-xs uppercase tracking-wider font-bold text-neutral-500 block mb-1">New Scan</span>
                      <span className="text-sm text-neutral-400">Run a daily checkup</span>
                    </div>
                    <button
                      onClick={() => setIsScanning(!isScanning)}
                      className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/20"
                    >
                      {isScanning ? 'Close Scanner' : 'Start Scan'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Scanner (if active) or Report List */}
                <div className="lg:col-span-7 space-y-6">
                  {isScanning ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <ContactlessScanner 
                        onScanComplete={() => {
                          const token = localStorage.getItem('token');
                          if (token) fetchHealthReports(token);
                        }} 
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-400" />
                        <span>Scan History</span>
                      </h2>
                      
                      {healthReports.length === 0 ? (
                        <div className="p-12 text-center rounded-3xl bg-white/5 border border-white/5 border-dashed">
                          <Activity className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                          <p className="text-neutral-400">No scans found. Start your first wellness scan today.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {healthReports.map((report) => (
                            <div key={report._id} className="p-5 rounded-2xl bg-neutral-900/50 border border-white/10 hover:border-indigo-500/30 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div>
                                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 mb-2 inline-block">
                                  {new Date(report.date).toLocaleString()}
                                </span>
                                <h3 className="text-base font-bold text-white mt-1">Overall Score: {report.vitals.overallWellnessIndex}</h3>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                  Condition: <span className={`font-bold ${report.conditionStatus === 'Critical' ? 'text-red-400' : report.conditionStatus === 'Warning' ? 'text-amber-400' : 'text-emerald-400'}`}>{report.conditionStatus || 'N/A'}</span>
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm mt-2 lg:mt-0">
                                <div className="text-center bg-white/5 px-3 py-1.5 rounded-lg">
                                  <span className="block text-[9px] text-neutral-500 font-bold uppercase">Heart Rate</span>
                                  <span className="font-mono text-rose-400">{report.vitals.heartRate} BPM</span>
                                </div>
                                <div className="text-center bg-white/5 px-3 py-1.5 rounded-lg">
                                  <span className="block text-[9px] text-neutral-500 font-bold uppercase">Resp Rate</span>
                                  <span className="font-mono text-cyan-400">{report.vitals.respiratoryRate || '--'}</span>
                                </div>
                                <div className="text-center bg-white/5 px-3 py-1.5 rounded-lg">
                                  <span className="block text-[9px] text-neutral-500 font-bold uppercase">HRV</span>
                                  <span className="font-mono text-purple-400">{report.vitals.hrv || '--'} ms</span>
                                </div>
                                <div className="text-center bg-white/5 px-3 py-1.5 rounded-lg">
                                  <span className="block text-[9px] text-neutral-500 font-bold uppercase">Stress</span>
                                  <span className="font-mono text-amber-400">{report.vitals.stressLevel}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Side: Security / Info Panel */}
                <div className="lg:col-span-5">
                  <div className="p-6 rounded-3xl bg-neutral-900/50 border border-white/10 space-y-4 sticky top-24">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Clinical Grade Privacy</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      Your facial biometric data is processed entirely in memory via secure optical rPPG channels. No video feeds are ever stored or transmitted to our servers beyond the initial volatile micro-vascular analysis.
                    </p>
                    <ul className="space-y-3 pt-4 border-t border-white/10 mt-4">
                      <li className="flex items-center gap-2 text-xs text-neutral-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        End-to-End Encrypted Storage
                      </li>
                      <li className="flex items-center gap-2 text-xs text-neutral-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        HIPAA Compliant Processing
                      </li>
                      <li className="flex items-center gap-2 text-xs text-neutral-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Volatile Frame Analysis
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthenticate={handleAuthenticate}
      />
      <Footer />
    </div>
  );
}
