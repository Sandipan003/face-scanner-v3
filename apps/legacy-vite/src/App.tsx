import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Shield, Camera, HeartPulse, ChevronRight, TrendingUp, 
  User as UserIcon, LogOut, ArrowRight, UserCheck, Stethoscope, 
  Sparkles, History, Heart, Clipboard, RefreshCw, Calendar, 
  AlertTriangle, CheckCircle, FileText, MessageSquareText, Wand2, BookOpen, Download
} from 'lucide-react';

import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { ContactlessScanner } from './components/ContactlessScanner';
import { ScannerFlow } from './components/ScannerFlow';
import { MedicalReportAnalyzer } from './components/MedicalReportAnalyzer';
import { AiHealthChat } from './components/AiHealthChat';
import { ClientDashboard } from './components/ClientDashboard';
import { Apothecary } from './components/Apothecary';
import { HealthAnalytics } from './components/HealthAnalytics';
import { Sidebar, TabType } from './components/Sidebar';
import { HealthBg3d } from './components/HealthBg3d';
import { ProphecyOrb3d } from './components/ProphecyOrb3d';
import { Footer } from './components/Footer';

import { User, HealthReport } from './types';

interface PatientWithStats {
  _id: string;
  name: string;
  email: string;
  age: number;
  bloodGroup: string;
  phone?: string;
  latestReport: HealthReport | null;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [healthReports, setHealthReports] = useState<HealthReport[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [authRole, setAuthRole] = useState<'patient' | 'doctor'>('patient');
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  // Doctor View States
  const [patients, setPatients] = useState<PatientWithStats[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithStats | null>(null);
  const [selectedPatientReports, setSelectedPatientReports] = useState<HealthReport[]>([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [clinicalBrief, setClinicalBrief] = useState<any | null>(null);

  // Fetch Health Reports for logged-in Patient
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

  // Fetch all patients for Doctor Dashboard
  const fetchPatientsForDoctor = async (token: string) => {
    try {
      const res = await fetch('/api/doctor/patients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPatients(data.patients);
        if (data.patients.length > 0 && !selectedPatient) {
          handleSelectPatient(data.patients[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch patients list', err);
    }
  };

  // Handle patient selection by doctor
  const handleSelectPatient = async (patient: PatientWithStats) => {
    setSelectedPatient(patient);
    setClinicalBrief(null);
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`/api/doctor/patients/${patient._id}/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedPatientReports(data.reports);
      }
    } catch (err) {
      console.error('Failed to fetch patient history', err);
    }
  };

  // Generate Healer Consultation Brief via Groq (called directly from browser)
  const handleGenerateSummary = async (targetPatient?: PatientWithStats) => {
    const p = targetPatient || selectedPatient;
    if (!p) return;
    setIsGeneratingSummary(true);
    setClinicalBrief(null);

    const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!groqApiKey) {
      console.error('[Brief] No VITE_GROQ_API_KEY in .env');
      setIsGeneratingSummary(false);
      return;
    }

    const reports = (selectedPatientReports.length > 0 ? selectedPatientReports : healthReports).slice(0, 5);
    const vitalsHistory = reports.map(r => ({
      date: new Date(r.date).toLocaleDateString(),
      heartRate: r.vitals.heartRate,
      status: r.conditionStatus || 'Normal',
      wellnessScore: r.vitals.overallWellnessScore || r.vitals.overallWellnessIndex || 'N/A',
      stressLevel: r.vitals.stressLevel || 'N/A',
      sleepQuality: r.vitals.sleepQualityEstimation || 'N/A',
      energyScore: r.vitals.energyScore || 'N/A',
    }));

    const prompt = `You are a senior medical AI generating a pre-consultation health brief. Analyze the patient data and respond with ONLY a flat JSON object — no markdown, no wrapper keys.

PATIENT:
Name: ${p.name}, Age: ${p.age}, Blood Group: ${p.bloodGroup || 'O+'}

RECENT BIOMETRIC HISTORY (${reports.length} sessions):
${JSON.stringify(vitalsHistory, null, 2)}

Respond with exactly this JSON structure (fill in realistic values):
{"summaryTitle":"Pre-Consultation Health Brief","dateGenerated":"${new Date().toLocaleDateString()}","overallHealthStatus":"Stable/At Risk/Needs Attention","chiefConcerns":["Concern 1","Concern 2","Concern 3"],"positiveFindings":["Good finding 1","Good finding 2"],"vitalsOverview":{"bloodGroup":"${p.bloodGroup || 'O+'}","avgHeartRate":"72 BPM","avgWellnessScore":"80/100","avgEnergyLevel":"Good","sleepTrend":"Consistent","stressPattern":"Low"},"labHighlights":[{"marker":"Heart Rate","baseline":"--","current":"${reports[0]?.vitals?.heartRate || '--'} BPM","trend":"Stable"},{"marker":"Wellness Score","baseline":"--","current":"${reports[0]?.vitals?.overallWellnessScore || '--'}/100","trend":"Improving"}],"targetedQuestions":["Question for your doctor 1?","Question for your doctor 2?","Question for your doctor 3?"],"recommendedTests":["Recommended test 1","Recommended test 2"],"lifestyleNotes":"A brief personalized lifestyle recommendation based on the biometric history."}`;

    try {
      console.log('[Brief] Calling Groq for consultation brief...');
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a senior medical AI. Respond ONLY with a flat JSON object. Never use markdown or wrapper keys.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);

      const data = await res.json();
      let parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
      const keys = Object.keys(parsed);
      if (keys.length === 1 && typeof parsed[keys[0]] === 'object') parsed = parsed[keys[0]];

      console.log('[Brief] Brief ready:', parsed);
      setClinicalBrief(parsed);
    } catch (err) {
      console.error('[Brief] Failed:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // First try to parse what we can from the token for an instant UI update
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const userObj: User = {
            id: payload.userId,
            name: payload.name || 'User',
            email: payload.email || 'user@example.com',
            age: payload.age || 30,
            role: payload.role || 'patient',
            avatar: '',
            points: Number(localStorage.getItem('user_points')) || 0
          };
          setUser(userObj);
        }
      } catch (e) {
        console.error('Error decoding token locally:', e);
      }

      // Then reliably fetch the full, latest user data from the backend
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setUser(data.user);
          // Only fetch reports once we know the real user role
          if (data.user.role === 'doctor') {
            fetchPatientsForDoctor(token);
          } else {
            fetchHealthReports(token);
          }
        } else {
          // Token might be invalid or user deleted
          localStorage.removeItem('token');
          setUser(null);
        }
      })
      .catch(err => {
        console.error("Failed to verify user on load:", err);
      });
    }
  }, []);

  const handleAuthenticate = (userData: User) => {
    setUser(userData);
    const token = localStorage.getItem('token');
    if (token) {
      if (userData.role === 'doctor') {
        fetchPatientsForDoctor(token);
      } else {
        fetchHealthReports(token);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setHealthReports([]);
    setPatients([]);
    setSelectedPatient(null);
    setSelectedPatientReports([]);
    setClinicalBrief(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 bg-magical-stars text-amber-100 font-serif selection:bg-amber-600 selection:text-white flex flex-col relative overflow-x-hidden">
      
      {/* Background Effect placeholder */}
      {/* <HealthBg3d /> - Assuming we want to keep it or replace it later, let's leave it for now */}

      {!user ? (
        <>
          <Navbar 
            user={null} 
            onLoginClick={() => {
              setAuthRole('patient');
              setIsAuthModalOpen(true);
            }} 
            onLogout={handleLogout} 
          />

          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 z-10">
            {/* Split Portals Landing Page */}
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="flex flex-col items-center justify-center space-y-12 py-10"
            >
              <div className="text-center space-y-4 max-w-3xl">
                <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 font-serif">
                  Ministry of Magic
                </h1>
                <h2 className="text-2xl sm:text-4xl text-amber-500 font-serif">Identity & Vitality Scanner</h2>
                <p className="text-base sm:text-xl text-amber-200/70 leading-relaxed font-sans">
                  The wizarding world's premier divination platform. Gaze into the Prophecy Orb for your magical aura checkup, analyze ancient scrolls, and consult with the Portrait of the Healer.
                </p>
              </div>

              {/* Magical Prophecy Orb Element */}
              <div className="w-full max-w-4xl px-4">
                <ProphecyOrb3d 
                  onScanClick={() => {
                    setAuthRole('patient');
                    setIsAuthModalOpen(true);
                  }} 
                />
              </div>

              {/* Portal Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                {/* Wizard Entry Card */}
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="p-8 rounded-[2rem] glass-panel-magical flex flex-col justify-between space-y-8 cursor-pointer hover:border-amber-400/50 transition-all group"
                  onClick={() => {
                    setAuthRole('patient');
                    setIsAuthModalOpen(true);
                  }}
                >
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Wand2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-amber-100 group-hover:text-amber-400 transition-colors font-serif">Wizard Portal</h3>
                    <p className="text-sm text-amber-200/70 leading-relaxed font-sans">
                      Register your wand, divine your magical pulse via the Orb, decipher potion recipes via OCR, and consult the Portrait Healer.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm font-sans tracking-widest uppercase">
                    <span>Enter Wizard Dashboard</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>

                {/* Vendor / Client Entry Card */}
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="p-8 rounded-[2rem] glass-panel-magical flex flex-col justify-between space-y-8 cursor-pointer hover:border-orange-500/50 transition-all group"
                  onClick={() => {
                    setAuthRole('client');
                    setIsAuthModalOpen(true);
                  }}
                >
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-amber-100 group-hover:text-orange-400 transition-colors font-serif">Apothecary Vendor</h3>
                    <p className="text-sm text-amber-200/70 leading-relaxed font-sans">
                      Establish your business, add magical remedies to the marketplace, and track potion sales.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-orange-400 font-bold text-sm font-sans tracking-widest uppercase">
                    <span>Enter Vendor Portal</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </div>

              {/* Download APK Button */}
              <motion.a
                href="/app-debug.apk"
                download="LumosHealth-App.apk"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-amber-600 to-red-800 hover:from-amber-500 hover:to-red-700 text-amber-100 rounded-full font-bold shadow-[0_0_30px_rgba(217,119,6,0.3)] hover:shadow-[0_0_40px_rgba(217,119,6,0.5)] transition-all font-serif text-xl border border-amber-500/30"
              >
                <Download className="w-6 h-6 animate-bounce" />
                <span>Download Android APK (Marauder's Edition)</span>
              </motion.a>

              {/* Bottom Magic compliance block */}
              <div className="flex items-center gap-3 p-4 px-6 rounded-full glass-panel-magical">
                <Shield className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="text-xs text-amber-200/70 font-sans tracking-[0.2em] uppercase">Ministry of Magic Approved & magically sealed</span>
              </div>
            </motion.div>
          </main>
          <Footer />
        </>
      ) : (
        /* Logged-In Layout with Sidebar */
        <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
          {/* Sidebar Component */}
          {user.role !== 'client' && (
            <Sidebar 
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              user={user}
              onLogout={handleLogout}
              isOpenMobile={isOpenMobile}
              onToggleMobile={() => setIsOpenMobile(!isOpenMobile)}
              onOpenProfile={() => setIsProfileModalOpen(true)}
            />
          )}

          {/* Main Module Content Area */}
          <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto z-10 overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* Client Role View */}
              {user.role === 'client' ? (
                <motion.div
                  key="client-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <ClientDashboard user={user} onLogout={handleLogout} />
                </motion.div>
              ) : user.role === 'doctor' ? (
                <motion.div
                  key="doctor-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-amber-900/30">
                    <div>
                      <h1 className="text-3xl font-extrabold text-amber-100 flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-emerald-400" />
                        <span>St Mungo's Clinical Ward</span>
                      </h1>
                      <p className="text-sm text-amber-200/70 mt-1 font-sans">Review registered wizard vitals and generate magical divination summaries</p>
                    </div>
                  </div>

                  {/* Doctor Patients & Reports Workspace */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Patients List */}
                    <div className="lg:col-span-4 space-y-4">
                      <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest font-sans">Wizard Roster</h3>
                      {patients.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl glass-panel-magical border-dashed">
                          <p className="text-sm text-amber-200/50">No wizards registered.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                          {patients.map((pat) => {
                            const isSelected = selectedPatient?._id === pat._id;
                            return (
                              <div
                                key={pat._id}
                                onClick={() => handleSelectPatient(pat)}
                                className={`p-5 rounded-2xl cursor-pointer border transition-all flex flex-col space-y-3 ${
                                  isSelected 
                                    ? 'bg-emerald-900/30 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                    : 'bg-black/40 border-amber-900/30 hover:border-emerald-500/30'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-bold text-amber-100 text-base">{pat.name}</h4>
                                    <span className="text-xs text-amber-200/60 block mt-0.5 font-sans">{pat.email}</span>
                                  </div>
                                  <span className="text-[10px] font-sans font-bold bg-amber-900/40 px-2 py-0.5 rounded-full text-amber-300">
                                    Age {pat.age}
                                  </span>
                                </div>

                                {pat.latestReport ? (
                                  <div className="flex items-center justify-between pt-2 border-t border-amber-900/30 text-xs font-sans">
                                    <span className="text-amber-200/50">Latest Magic Pulse:</span>
                                    <span className="font-mono text-red-400 font-bold">{pat.latestReport.vitals.heartRate}</span>
                                    <span className={`font-bold ${
                                      pat.latestReport.conditionStatus === 'Critical' 
                                        ? 'text-red-500' 
                                        : pat.latestReport.conditionStatus === 'Warning' 
                                        ? 'text-amber-500' 
                                        : 'text-emerald-500'
                                    }`}>
                                      {pat.latestReport.conditionStatus || 'Stable'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-amber-200/40 italic block pt-1 border-t border-amber-900/30">No divination history</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Patient Details & Gemini Clinical Summary */}
                    <div className="lg:col-span-8 space-y-6">
                      {selectedPatient ? (
                        <div className="space-y-6">
                          <div className="p-6 rounded-3xl glass-panel-magical flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] block mb-1 font-sans">Active Wizard</span>
                              <h2 className="text-2xl font-extrabold text-amber-100">{selectedPatient.name}</h2>
                              <div className="flex items-center gap-3 text-xs text-amber-200/60 mt-1 font-sans">
                                <span>Age: {selectedPatient.age}</span>
                                <span>•</span>
                                <span>Blood: {selectedPatient.bloodGroup || 'Pure-blood'}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleGenerateSummary()}
                              disabled={isGeneratingSummary}
                              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-600 hover:from-emerald-700 text-white font-bold text-xs shadow-lg flex items-center gap-2 border border-emerald-500/30"
                            >
                              <Sparkles className="w-4 h-4" />
                              <span>{isGeneratingSummary ? 'Divining Future...' : 'Generate Prophecy Brief'}</span>
                            </button>
                          </div>

                          {clinicalBrief && (
                            <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/20 space-y-4">
                              <h3 className="text-lg font-bold text-amber-100 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-emerald-400" />
                                <span>{clinicalBrief.summaryTitle || 'Healer\'s Prophecy'}</span>
                              </h3>
                              <p className="text-sm text-amber-200/80 leading-relaxed font-sans">{clinicalBrief.chiefConcerns?.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-12 text-center rounded-3xl glass-panel-magical border-dashed">
                          <p className="text-sm text-amber-200/50 font-sans">Select a wizard from the roster to view their magical aura.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Patient Role Tabs */
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* TAB 1: Dashboard & Vitals Overview */}
                  {activeTab === 'dashboard' && (
                     <div className="space-y-8">
                      {/* Magical Prophecy Orb Section */}
                      <ProphecyOrb3d 
                        onScanClick={() => setActiveTab('scanner')} 
                      />

                      {/* Top Header Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-6 rounded-3xl glass-panel-magical flex items-center gap-4">
                          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <HeartPulse className="w-8 h-8" />
                          </div>
                          <div>
                            <span className="text-xs uppercase tracking-widest font-bold text-amber-500 block font-sans">Total Spells Cast</span>
                            <span className="text-3xl font-extrabold text-amber-100">{healthReports.length}</span>
                          </div>
                        </div>

                        <div className="p-6 rounded-3xl glass-panel-magical flex items-center gap-4">
                          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            <TrendingUp className="w-8 h-8" />
                          </div>
                          <div>
                            <span className="text-xs uppercase tracking-widest font-bold text-amber-500 block font-sans">Avg Curse Level</span>
                            <span className="text-xl font-bold text-amber-100">
                              {healthReports.length > 0 ? healthReports[0].vitals.stressLevel : 'None'}
                            </span>
                          </div>
                        </div>

                        <div className="p-6 rounded-3xl glass-panel-magical flex items-center gap-4">
                          <div className="w-full flex justify-between items-center">
                            <div>
                              <span className="text-xs uppercase tracking-widest font-bold text-amber-500 block mb-1 font-sans">Gaze into the Orb</span>
                              <span className="text-xs text-amber-200/60 font-sans">Magical aura checkup</span>
                            </div>
                            <button
                              onClick={() => setActiveTab('scanner')}
                              className="px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] border border-amber-500/30"
                            >
                              Cast Scan
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Main History layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7 space-y-4">
                          <h2 className="text-xl font-bold text-amber-100 flex items-center gap-2">
                            <History className="w-5 h-5 text-amber-400" />
                            <span>Book of Past Prophecies</span>
                          </h2>

                          {healthReports.length === 0 ? (
                            <div className="p-12 text-center rounded-3xl glass-panel-magical border-dashed">
                              <BookOpen className="w-12 h-12 text-amber-900/50 mx-auto mb-4" />
                              <p className="text-amber-200/50 text-xs font-sans">No prophecies found. Gaze into the Prophecy Orb to reveal your magical vitals.</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {healthReports.map((report) => (
                                <div key={report._id} className="p-5 rounded-2xl glass-panel-magical hover:border-amber-400/50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                  <div>
                                    <span className="text-[10px] font-sans tracking-widest text-amber-400 bg-amber-900/30 px-2.5 py-1 rounded-full border border-amber-500/20 mb-2 inline-block">
                                      {new Date(report.date).toLocaleString()}
                                    </span>
                                    <h3 className="text-base font-bold text-amber-100 mt-1">Purity Score: {report.vitals.overallWellnessIndex}</h3>
                                    <p className="text-xs text-amber-200/60 mt-0.5 font-sans">
                                      Aura Status: <span className={`font-bold ${report.conditionStatus === 'Critical' ? 'text-red-500' : report.conditionStatus === 'Warning' ? 'text-amber-500' : 'text-emerald-500'}`}>{report.conditionStatus || 'Stable'}</span>
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-3 text-xs mt-2 lg:mt-0 font-sans">
                                    <div className="bg-black/40 px-3 py-1.5 rounded-lg text-center border border-amber-900/20">
                                      <span className="block text-[8px] text-amber-500 font-bold uppercase tracking-widest">Magic Pulse</span>
                                      <span className="font-mono text-red-400 font-bold">{report.vitals.heartRate}</span>
                                    </div>
                                    <div className="bg-black/40 px-3 py-1.5 rounded-lg text-center border border-amber-900/20">
                                      <span className="block text-[8px] text-amber-500 font-bold uppercase tracking-widest">Mana Rate</span>
                                      <span className="font-mono text-cyan-400 font-bold">{report.vitals.respiratoryRate || '--'}</span>
                                    </div>
                                    <div className="bg-black/40 px-3 py-1.5 rounded-lg text-center border border-amber-900/20">
                                      <span className="block text-[8px] text-amber-500 font-bold uppercase tracking-widest">Resonance</span>
                                      <span className="font-mono text-purple-400 font-bold">{report.vitals.hrv || '--'} ms</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="lg:col-span-5">
                          <div className="p-6 rounded-3xl glass-panel-magical space-y-4">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
                              <Shield className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-amber-100">Unbreakable Vow of Privacy</h3>
                            <p className="text-xs text-amber-200/70 leading-relaxed font-sans">
                              Your magical essence is analyzed directly via encrypted wards. No memories or visual traces are retained in the pensieve beyond the immediate divination.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Face Scanner */}
                  {activeTab === 'scanner' && (
                    <ScannerFlow 
                      token={localStorage.getItem('token') || ''}
                      onComplete={async () => {
                        console.log("ScannerFlow onComplete triggered!");
                        const token = localStorage.getItem('token');
                        if (token) fetchHealthReports(token);
                        
                        // Securely award 50 House Points
                        if (token) {
                          try {
                            console.log("Sending request to /api/user/award-points");
                            const res = await fetch('/api/user/award-points', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({ amount: 50, reason: "Completed Prophecy Scan" })
                            });
                            const data = await res.json();
                            console.log("Award points response:", data);
                            if (data.success) {
                              setUser(prev => prev ? { ...prev, points: data.points } : prev);
                            }
                          } catch (err) {
                            console.error("Failed to award points", err);
                          }
                        }
                      }}
                    />
                  )}

                  {/* TAB 3: Medical Report Analyzer OCR */}
                  {activeTab === 'analyzer' && (
                    <MedicalReportAnalyzer />
                  )}

                  {/* TAB 4: AI Health Companion Chat */}
                  {activeTab === 'chat' && (
                    <AiHealthChat healthReports={healthReports} />
                  )}

                  {/* TAB 5: Doctor Consultation Brief Prep */}
                  {activeTab === 'brief' && (
                    <div className="space-y-6">
                      {/* Header Card */}
                      <div className="p-6 rounded-3xl glass-panel-magical flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-amber-100">Healer Consultation Prep</h2>
                            <p className="text-xs text-amber-200/70 mt-0.5 font-sans">Generate an AI-powered health brief for your next medical appointment</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleGenerateSummary({ _id: user.id, name: user.name, email: user.email, age: user.age, bloodGroup: 'O+', latestReport: healthReports[0] || null })}
                          disabled={isGeneratingSummary}
                          className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 border border-amber-500/40 text-amber-100 text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center gap-2 disabled:opacity-50 transition-all font-sans"
                        >
                          {isGeneratingSummary ? (
                            <><Activity className="w-4 h-4 animate-spin" />Generating...</>
                          ) : (
                            <><Sparkles className="w-4 h-4" />Compile My Prophecy Brief</>
                          )}
                        </button>
                      </div>

                      {/* No reports notice */}
                      {!isGeneratingSummary && !clinicalBrief && healthReports.length === 0 && (
                        <div className="p-8 rounded-3xl glass-panel-magical text-center border-dashed">
                          <Camera className="w-10 h-10 text-amber-500/40 mx-auto mb-3" />
                          <p className="text-amber-200/60 font-sans text-sm">Complete a Prophecy Orb scan first to generate your health brief.</p>
                          <button onClick={() => setActiveTab('scanner')} className="mt-4 px-4 py-2 rounded-xl bg-amber-700/30 border border-amber-500/30 text-amber-300 text-xs font-bold font-sans hover:bg-amber-700/50 transition-all">
                            Go to Prophecy Orb
                          </button>
                        </div>
                      )}

                      {/* Loading state */}
                      {isGeneratingSummary && (
                        <div className="p-10 rounded-3xl glass-panel-magical text-center">
                          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
                          </div>
                          <p className="text-amber-200 font-serif text-lg font-bold">Consulting the Oracle...</p>
                          <p className="text-amber-200/50 font-sans text-sm mt-2">Analyzing your biometric history and crafting your health brief.</p>
                        </div>
                      )}

                      {/* Brief Results */}
                      {clinicalBrief && !isGeneratingSummary && (
                        <div className="space-y-4">
                          {/* Brief Title & Status */}
                          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-900/30 to-amber-800/10 border border-amber-500/30 flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-amber-100 font-serif">{clinicalBrief.summaryTitle || 'Health Brief'}</h3>
                              <p className="text-xs text-amber-200/60 font-sans mt-0.5">Generated: {clinicalBrief.dateGenerated}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold font-sans border ${
                              clinicalBrief.overallHealthStatus === 'Stable' ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500/40' :
                              clinicalBrief.overallHealthStatus === 'At Risk' ? 'bg-amber-900/40 text-amber-300 border-amber-500/40' :
                              'bg-red-900/40 text-red-300 border-red-500/40'
                            }`}>
                              {clinicalBrief.overallHealthStatus || 'Analyzed'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                            {/* Chief Concerns */}
                            {clinicalBrief.chiefConcerns?.length > 0 && (
                              <div className="p-5 rounded-2xl bg-red-900/10 border border-red-500/20">
                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block mb-3">⚠ Areas to Discuss</span>
                                <ul className="space-y-2">
                                  {clinicalBrief.chiefConcerns.map((c: string, i: number) => (
                                    <li key={i} className="text-xs text-amber-200/80 flex items-start gap-2">
                                      <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />{c}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Positive Findings */}
                            {clinicalBrief.positiveFindings?.length > 0 && (
                              <div className="p-5 rounded-2xl bg-emerald-900/10 border border-emerald-500/20">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-3">✓ Positive Findings</span>
                                <ul className="space-y-2">
                                  {clinicalBrief.positiveFindings.map((f: string, i: number) => (
                                    <li key={i} className="text-xs text-amber-200/80 flex items-start gap-2">
                                      <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />{f}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Vitals Overview */}
                            {clinicalBrief.vitalsOverview && (
                              <div className="p-5 rounded-2xl bg-black/40 border border-amber-900/30">
                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-3">📊 Vitals Overview</span>
                                <div className="space-y-1.5">
                                  {Object.entries(clinicalBrief.vitalsOverview).map(([k, v]: [string, any]) => (
                                    <div key={k} className="flex justify-between">
                                      <span className="text-[11px] text-amber-200/50 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                                      <span className="text-[11px] text-amber-100 font-semibold">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Questions for Doctor */}
                            {clinicalBrief.targetedQuestions?.length > 0 && (
                              <div className="p-5 rounded-2xl bg-purple-900/10 border border-purple-500/20">
                                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-3">💬 Questions for Your Doctor</span>
                                <ol className="space-y-2 list-decimal list-inside">
                                  {clinicalBrief.targetedQuestions.map((q: string, i: number) => (
                                    <li key={i} className="text-xs text-amber-200/80">{q}</li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </div>

                          {/* Lab Highlights */}
                          {clinicalBrief.labHighlights?.length > 0 && (
                            <div className="p-5 rounded-2xl bg-black/40 border border-amber-900/30">
                              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-3">🔬 Biometric Highlights</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {clinicalBrief.labHighlights.map((l: any, i: number) => (
                                  <div key={i} className="p-3 rounded-xl bg-amber-900/10 border border-amber-800/30">
                                    <span className="text-[10px] font-bold text-amber-400 block">{l.marker}</span>
                                    <span className="text-sm font-bold text-amber-100 block mt-1">{l.current}</span>
                                    <span className={`text-[10px] font-sans ${l.trend?.includes('Improv') ? 'text-emerald-400' : l.trend?.includes('Elevat') ? 'text-red-400' : 'text-amber-400'}`}>{l.trend}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Lifestyle Notes & Recommended Tests */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {clinicalBrief.lifestyleNotes && (
                              <div className="p-5 rounded-2xl bg-cyan-900/10 border border-cyan-500/20">
                                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-2">🌿 Lifestyle Recommendations</span>
                                <p className="text-xs text-amber-200/80 leading-relaxed">{clinicalBrief.lifestyleNotes}</p>
                              </div>
                            )}
                            {clinicalBrief.recommendedTests?.length > 0 && (
                              <div className="p-5 rounded-2xl bg-violet-900/10 border border-violet-500/20">
                                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-2">🧪 Recommended Tests</span>
                                <ul className="space-y-1">
                                  {clinicalBrief.recommendedTests.map((t: string, i: number) => (
                                    <li key={i} className="text-xs text-amber-200/80 flex items-center gap-2"><FileText className="w-3 h-3 text-violet-400" />{t}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Refresh button */}
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleGenerateSummary({ _id: user.id, name: user.name, email: user.email, age: user.age, bloodGroup: 'O+', latestReport: healthReports[0] || null })}
                              className="text-xs text-amber-400/60 hover:text-amber-300 font-sans flex items-center gap-1.5 transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" /> Regenerate Brief
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 6: Apothecary */}
                  {activeTab === 'apothecary' && (
                    <Apothecary 
                      user={user} 
                      onUpdatePoints={(points) => setUser(prev => prev ? { ...prev, points } : prev)} 
                    />
                  )}

                  {/* TAB 7: Health Analytics */}
                  {activeTab === 'analytics' && (
                    <HealthAnalytics healthReports={healthReports} />
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthenticate={handleAuthenticate}
        role={authRole}
      />

      {user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
          onUpdate={(updatedUser) => setUser(updatedUser)}
        />
      )}
    </div>
  );
}
