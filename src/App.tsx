import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Shield, Camera, HeartPulse, ChevronRight, TrendingUp, 
  User as UserIcon, LogOut, ArrowRight, UserCheck, Stethoscope, 
  Sparkles, History, Heart, Clipboard, RefreshCw, Calendar, 
  AlertTriangle, CheckCircle, FileText, MessageSquareText 
} from 'lucide-react';

import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ContactlessScanner } from './components/ContactlessScanner';
import { MedicalReportAnalyzer } from './components/MedicalReportAnalyzer';
import { AiHealthChat } from './components/AiHealthChat';
import { Sidebar, TabType } from './components/Sidebar';
import { HealthBg3d } from './components/HealthBg3d';
import { BiometricHeart3d } from './components/BiometricHeart3d';
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

  // Generate Doctor Consultation Summary via Gemini
  const handleGenerateSummary = async (targetPatient?: PatientWithStats) => {
    const p = targetPatient || selectedPatient;
    if (!p) return;
    setIsGeneratingSummary(true);
    setClinicalBrief(null);
    const token = localStorage.getItem('token');
    try {
      const payload = {
        patientProfile: {
          name: p.name,
          age: p.age,
          bloodGroup: p.bloodGroup || 'O+',
          chronicConditions: ['None recorded'],
          allergies: ['None recorded'],
          currentMedications: []
        },
        timelineEvents: (selectedPatientReports.length > 0 ? selectedPatientReports : healthReports).slice(0, 3).map(r => ({
          title: `Biometric screening session`,
          date: new Date(r.date).toLocaleDateString(),
          description: `Vitals index: ${r.vitals.overallWellnessIndex}, status: ${r.conditionStatus || 'Normal'}`
        })),
        recentLabResults: (selectedPatientReports.length > 0 ? selectedPatientReports : healthReports).map(r => ({
          marker: 'Heart Rate (rPPG)',
          value: `${r.vitals.heartRate} BPM`,
          status: r.conditionStatus || 'Normal'
        })),
        specificConcerns: `Pre-clinical brief for ${p.name}`
      };

      const res = await fetch('/api/doctor-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setClinicalBrief(data);
      }
    } catch (err) {
      console.error('Failed to generate summary brief', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
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
            avatar: ''
          };
          setUser(userObj);
          
          if (payload.role === 'doctor') {
            fetchPatientsForDoctor(token);
          } else {
            fetchHealthReports(token);
          }
        }
      } catch (e) {
        console.error('Error decoding token:', e);
        localStorage.removeItem('token');
      }
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
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500 selection:text-white flex flex-col relative overflow-x-hidden">
      
      {/* Dynamic 3D Healthcare Canvas Background */}
      <HealthBg3d />

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
                <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400">
                  Swast AI
                </h1>
                <p className="text-base sm:text-xl text-neutral-400 leading-relaxed">
                  Next-generation health screening platform. Perform contactless optical face scans, analyze lab documents with Gemini OCR, and query our RAG health companion.
                </p>
              </div>

              {/* Interactive 3D Biometric Heart Element */}
              <div className="w-full max-w-4xl px-4">
                <BiometricHeart3d 
                  initialBpm={72} 
                  onScanClick={() => {
                    setAuthRole('patient');
                    setIsAuthModalOpen(true);
                  }} 
                />
              </div>

              {/* Portal Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                {/* Patient Entry Card */}
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="p-8 rounded-3xl bg-neutral-950/60 border border-white/10 backdrop-blur-xl flex flex-col justify-between space-y-8 cursor-pointer shadow-xl hover:border-indigo-500/30 transition-all group"
                  onClick={() => {
                    setAuthRole('patient');
                    setIsAuthModalOpen(true);
                  }}
                >
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">Patient Portal</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      Register, scan your face via optical rPPG, analyze lab reports via OCR, and chat with our RAG AI companion.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <span>Enter Patient Dashboard</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>

                {/* Doctor Entry Card */}
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="p-8 rounded-3xl bg-neutral-950/60 border border-white/10 backdrop-blur-xl flex flex-col justify-between space-y-8 cursor-pointer shadow-xl hover:border-teal-500/30 transition-all group"
                  onClick={() => {
                    setAuthRole('doctor');
                    setIsAuthModalOpen(true);
                  }}
                >
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Stethoscope className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-teal-400 transition-colors">Doctor Portal</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      Access clinical workspace, review patient rosters, track vitals trends, and compile Gemini pre-consultation briefs.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                    <span>Enter Clinical Workspace</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </div>

              {/* Bottom HIPAA compliance block */}
              <div className="flex items-center gap-3 p-4 px-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <Shield className="w-5 h-5 text-neutral-400 animate-pulse" />
                <span className="text-xs text-neutral-400 font-mono tracking-wider uppercase">HIPAA Compliant & End-to-End Encrypted</span>
              </div>
            </motion.div>
          </main>
          <Footer />
        </>
      ) : (
        /* Logged-In Layout with Sidebar */
        <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
          {/* Sidebar Component */}
          <Sidebar 
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            user={user}
            onLogout={handleLogout}
            isOpenMobile={isOpenMobile}
            onToggleMobile={() => setIsOpenMobile(!isOpenMobile)}
          />

          {/* Main Module Content Area */}
          <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto z-10 overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* Doctor Role View */}
              {user.role === 'doctor' ? (
                <motion.div
                  key="doctor-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
                    <div>
                      <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                        <Stethoscope className="w-8 h-8 text-teal-400" />
                        <span>Doctor Clinical Console</span>
                      </h1>
                      <p className="text-sm text-neutral-400 mt-1">Review registered patient vitals and generate Gemini pre-clinical briefing summaries</p>
                    </div>
                  </div>

                  {/* Doctor Patients & Reports Workspace */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Patients List */}
                    <div className="lg:col-span-4 space-y-4">
                      <h3 className="text-sm font-extrabold text-neutral-400 uppercase tracking-wider">Patient Roster</h3>
                      {patients.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 border-dashed">
                          <p className="text-sm text-neutral-500">No patients registered.</p>
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
                                    ? 'bg-teal-500/10 border-teal-500/40 shadow-lg' 
                                    : 'bg-neutral-900/40 border-white/10 hover:border-teal-500/20'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-bold text-white text-base">{pat.name}</h4>
                                    <span className="text-xs text-neutral-400 block mt-0.5">{pat.email}</span>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded-full text-neutral-300">
                                    Age {pat.age}
                                  </span>
                                </div>

                                {pat.latestReport ? (
                                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                                    <span className="text-neutral-500">Latest Vital:</span>
                                    <span className="font-mono text-rose-400 font-bold">{pat.latestReport.vitals.heartRate} BPM</span>
                                    <span className={`font-bold ${
                                      pat.latestReport.conditionStatus === 'Critical' 
                                        ? 'text-red-400' 
                                        : pat.latestReport.conditionStatus === 'Warning' 
                                        ? 'text-amber-400' 
                                        : 'text-emerald-400'
                                    }`}>
                                      {pat.latestReport.conditionStatus || 'Optimal'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-neutral-500 italic block pt-1 border-t border-white/5">No vitals history</span>
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
                          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block mb-1">Active Patient</span>
                              <h2 className="text-2xl font-extrabold text-white">{selectedPatient.name}</h2>
                              <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                                <span>Age: {selectedPatient.age}</span>
                                <span>•</span>
                                <span>Blood: {selectedPatient.bloodGroup || 'O+'}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleGenerateSummary()}
                              disabled={isGeneratingSummary}
                              className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 text-white font-bold text-xs shadow-lg flex items-center gap-2"
                            >
                              <Sparkles className="w-4 h-4" />
                              <span>{isGeneratingSummary ? 'Generating Brief...' : 'Generate AI Brief'}</span>
                            </button>
                          </div>

                          {clinicalBrief && (
                            <div className="p-6 rounded-3xl bg-teal-500/5 border border-teal-500/20 space-y-4">
                              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-teal-400" />
                                <span>{clinicalBrief.summaryTitle || 'Pre-Clinical Brief'}</span>
                              </h3>
                              <p className="text-xs text-neutral-300 leading-relaxed">{clinicalBrief.chiefConcerns?.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-12 text-center rounded-3xl bg-neutral-900/40 border border-white/10 border-dashed">
                          <p className="text-sm text-neutral-400">Select a patient from the roster to view details.</p>
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
                      {/* 3D Interactive Cardiac Model Section */}
                      <BiometricHeart3d 
                        initialBpm={healthReports.length > 0 ? healthReports[0].vitals.heartRate : 72} 
                        onScanClick={() => setActiveTab('scanner')} 
                      />

                      {/* Top Header Cards */}
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

                        <div className="p-6 rounded-3xl bg-neutral-900/50 border border-white/10 backdrop-blur-xl flex items-center gap-4">
                          <div className="w-full flex justify-between items-center">
                            <div>
                              <span className="text-xs uppercase tracking-wider font-bold text-neutral-500 block mb-1">Face rPPG Scanner</span>
                              <span className="text-xs text-neutral-400">Optical camera checkup</span>
                            </div>
                            <button
                              onClick={() => setActiveTab('scanner')}
                              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-500/20"
                            >
                              Start Scan
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Main History & Security layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7 space-y-4">
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-400" />
                            <span>Biometric Scan History</span>
                          </h2>

                          {healthReports.length === 0 ? (
                            <div className="p-12 text-center rounded-3xl bg-white/5 border border-white/5 border-dashed">
                              <Activity className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                              <p className="text-neutral-400 text-xs">No scans found. Use the Face Scanner tab to run your first wellness checkup.</p>
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
                                  <div className="flex flex-wrap gap-3 text-xs mt-2 lg:mt-0">
                                    <div className="bg-white/5 px-3 py-1.5 rounded-lg text-center">
                                      <span className="block text-[8px] text-neutral-500 font-bold uppercase">Heart Rate</span>
                                      <span className="font-mono text-rose-400 font-bold">{report.vitals.heartRate} BPM</span>
                                    </div>
                                    <div className="bg-white/5 px-3 py-1.5 rounded-lg text-center">
                                      <span className="block text-[8px] text-neutral-500 font-bold uppercase">Resp Rate</span>
                                      <span className="font-mono text-cyan-400 font-bold">{report.vitals.respiratoryRate || '--'}</span>
                                    </div>
                                    <div className="bg-white/5 px-3 py-1.5 rounded-lg text-center">
                                      <span className="block text-[8px] text-neutral-500 font-bold uppercase">HRV</span>
                                      <span className="font-mono text-purple-400 font-bold">{report.vitals.hrv || '--'} ms</span>
                                    </div>
                                    <div className="bg-white/5 px-3 py-1.5 rounded-lg text-center">
                                      <span className="block text-[8px] text-neutral-500 font-bold uppercase">Stress</span>
                                      <span className="font-mono text-amber-400 font-bold">{report.vitals.stressLevel}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="lg:col-span-5">
                          <div className="p-6 rounded-3xl bg-neutral-900/50 border border-white/10 space-y-4">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                              <Shield className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-white">Clinical Grade Privacy</h3>
                            <p className="text-xs text-neutral-400 leading-relaxed">
                              Facial telemetry is analyzed directly via FFmpeg signalstats. No raw video files are retained beyond the micro-vascular frame processing.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Face Scanner */}
                  {activeTab === 'scanner' && (
                    <ContactlessScanner 
                      onScanComplete={() => {
                        const token = localStorage.getItem('token');
                        if (token) fetchHealthReports(token);
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
                      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                            <Stethoscope className="w-6 h-6" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white">Doctor Consultation Brief Prep</h2>
                            <p className="text-xs text-neutral-400 mt-0.5">Generate a clinical brief of your recent vitals history to take to your next doctor visit</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleGenerateSummary({ _id: user.id, name: user.name, email: user.email, age: user.age, bloodGroup: 'O+', latestReport: null })}
                          disabled={isGeneratingSummary}
                          className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg flex items-center gap-2 disabled:opacity-50"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>{isGeneratingSummary ? 'Compiling Brief...' : 'Compile My Clinical Brief'}</span>
                        </button>
                      </div>

                      {clinicalBrief && (
                        <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-6">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-400" />
                            <span>{clinicalBrief.summaryTitle}</span>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 space-y-2">
                              <span className="text-[10px] font-bold text-blue-400 uppercase">Chief Concerns</span>
                              <p className="text-xs text-neutral-300">{clinicalBrief.chiefConcerns?.join(', ')}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 space-y-2">
                              <span className="text-[10px] font-bold text-blue-400 uppercase">Suggested Doctor Questions</span>
                              <ul className="text-xs text-neutral-300 list-disc list-inside space-y-1">
                                {clinicalBrief.targetedQuestions?.map((q: string, i: number) => (
                                  <li key={i}>{q}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
    </div>
  );
}
