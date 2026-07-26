import React, { useEffect, useRef, useState } from 'react';
import { CameraService } from '../services/CameraService';
import { FaceValidator, ValidationStatus } from '../services/FaceValidator';
import { MetricsDashboard } from './MetricsDashboard';
import { DetailedHealthReport } from './DetailedHealthReport';
import { AlertCircle, Camera, CheckCircle2, Loader2, CheckCircle, RefreshCw, ArrowRight, FileText, Sparkles } from 'lucide-react';

export const ScannerFlow = ({ token, onComplete }: { token: string; onComplete: (scanId: string) => void }) => {
  const [status, setStatus] = useState<'idle' | 'starting' | 'validating' | 'running' | 'completed' | 'error' | 'analyzing_report' | 'report_ready'>('idle');
  const [validation, setValidation] = useState<ValidationStatus | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [advancedReport, setAdvancedReport] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoMountRef = useRef<HTMLDivElement>(null);
  
  const cameraService = useRef(new CameraService());
  const faceValidator = useRef(new FaceValidator());
  const ws = useRef<WebSocket | null>(null);
  const metricsRef = useRef<any>(null); // always-fresh copy of metrics state
  const intentionalClose = useRef(false); // flag: we closed WS ourselves, don't override status

  useEffect(() => {
    return () => {
      cameraService.current.stop();
      if (ws.current) ws.current.close();
    };
  }, []);

  const startScan = async () => {
    setStatus('starting');
    // Reset flags for a fresh scan
    intentionalClose.current = false;
    setAdvancedReport(null);
    setShowReport(false);
    setIsGeneratingReport(false);
    metricsRef.current = null;
    
    if (videoMountRef.current) {
      const vid = cameraService.current.getVideoElement();
      vid.className = 'w-full h-full object-cover rounded-xl transform scale-x-[-1]';
      
      // Clean up previously appended children safely
      while (videoMountRef.current.firstChild) {
        videoMountRef.current.removeChild(videoMountRef.current.firstChild);
      }
      
      videoMountRef.current.appendChild(vid);
    }

    const granted = await cameraService.current.requestPermissions();
    if (!granted) {
      setStatus('error');
      setErrorMsg('Camera permission denied. Please allow camera access.');
      return;
    }

    connectWebSocket();
  };

  const connectWebSocket = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    let wsUrl = '';
    if (backendUrl) {
      wsUrl = backendUrl.replace(/^http/, 'ws') + `/api/scan/stream?token=${token}`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/api/scan/stream?token=${token}`;
    }
    
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      setStatus('validating');
      cameraService.current.startFrameExtraction((blob) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(blob);
        }
      }, 30);
    };

    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'validation') {
        const valStatus = faceValidator.current.processServerValidation(msg.code, msg.hint);
        setValidation(valStatus);
        
        setStatus(prev => {
          if (valStatus.isValid && prev !== 'running') {
            return 'running';
          }
          return prev;
        });
      } else if (msg.type === 'metrics') {
        setMetrics((prev: any) => {
          // Note: we update metricsRef inside setMetrics to always have fresh data
          if (!prev) return msg.data;
          
          // Deep merge the arrays so we don't lose previous readings if the current packet omits them
          const newMetrics = { ...prev };
          
          if (msg.data.cardio) {
            newMetrics.cardio = { ...prev.cardio, ...msg.data.cardio };
            
            if (msg.data.cardio.pulseRate?.length > 0) {
              newMetrics.cardio.pulseRate = [...(prev.cardio?.pulseRate || []), ...msg.data.cardio.pulseRate];
            } else {
              newMetrics.cardio.pulseRate = prev.cardio?.pulseRate || [];
            }
            
            if (msg.data.cardio.hrv?.length > 0) {
              newMetrics.cardio.hrv = [...(prev.cardio?.hrv || []), ...msg.data.cardio.hrv];
            } else {
              newMetrics.cardio.hrv = prev.cardio?.hrv || [];
            }
            
            if (msg.data.cardio.arterialPressureTrace?.length > 0) {
              newMetrics.cardio.arterialPressureTrace = [...(prev.cardio?.arterialPressureTrace || []), ...msg.data.cardio.arterialPressureTrace];
              if (newMetrics.cardio.arterialPressureTrace.length > 200) {
                newMetrics.cardio.arterialPressureTrace = newMetrics.cardio.arterialPressureTrace.slice(-200);
              }
            } else {
              newMetrics.cardio.arterialPressureTrace = prev.cardio?.arterialPressureTrace || [];
            }
          }
          
          if (msg.data.breathing) {
            newMetrics.breathing = { ...prev.breathing, ...msg.data.breathing };
            
            if (msg.data.breathing.rate?.length > 0) {
              newMetrics.breathing.rate = [...(prev.breathing?.rate || []), ...msg.data.breathing.rate];
            } else {
              newMetrics.breathing.rate = prev.breathing?.rate || [];
            }
          }
          
          metricsRef.current = newMetrics; // keep ref in sync
          return newMetrics;
        });
      } else if (msg.type === 'error') {
        setStatus('error');
        setErrorMsg(msg.message || 'An error occurred during scanning');
      }
    };

    ws.current.onclose = (e) => {
      console.log('WS Closed', e.code, e.reason, '| intentional:', intentionalClose.current);
      if (intentionalClose.current) {
        // We closed it ourselves — do NOT touch the status
        return;
      }
      setStatus(prev => {
        if (prev === 'running') {
          onComplete('scan_id_placeholder');
          return 'completed';
        } else if (e.code !== 1000) {
          setErrorMsg(`Connection closed unexpectedly: ${e.reason || e.code}`);
          return 'error';
        }
        return prev;
      });
    };

    ws.current.onerror = (e) => {
      console.error('WS Error', e);
      setStatus('error');
      setErrorMsg('Failed to connect to health scan server.');
    };
  };

  const generateAdvancedReport = async () => {
    const currentMetrics = metricsRef.current;
    console.log('[Report] Starting Groq call, metrics:', currentMetrics ? 'present' : 'null');

    const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!groqApiKey) {
      console.error('[Report] No VITE_GROQ_API_KEY in .env');
      setStatus('completed');
      return;
    }

    const hrvArr = currentMetrics?.hrv || [];
    const avgHRV = hrvArr.length
      ? Math.round(hrvArr.reduce((s: number, x: any) => s + (x.sdnn ?? x.value ?? 0), 0) / hrvArr.length)
      : '--';
    const pulseArr = currentMetrics?.pulseRate || [];
    const avgHR = pulseArr.length
      ? Math.round(pulseArr.reduce((s: number, x: any) => s + (x.value ?? x), 0) / pulseArr.length)
      : 72;
    const breathRate = currentMetrics?.rate?.[currentMetrics?.rate?.length - 1]?.value || 16;
    const confidence = currentMetrics?.signalConfidence || 60;

    const prompt = `You are a medical wellness AI. Analyze the biometric data below and respond with ONLY a flat JSON object — no nested objects, no wrapper keys, no markdown, no explanation.

BIOMETRIC DATA:
Heart Rate: ${avgHR} bpm
Heart Rate Variability (HRV): ${avgHRV} ms
Breathing Rate: ${breathRate} rpm
Signal Confidence: ${confidence}%

Respond with exactly this flat JSON structure (fill in realistic values based on the data):
{"wrinkles":"Mild","skinTone":"Fitzpatrick Type III","pigmentation":"Clear","darkCircles":"None","hydration":"Well-hydrated","skinAge":27,"faceShape":"Oval","facialSymmetry":"High","faceFatPercentage":18.5,"bodyFatEstimation":20.0,"jawlineDefinition":"Sharp","neckFat":"Minimal","doubleChinDetection":"None","stressLevel":"Low","fatigueScore":25,"sleepQualityEstimation":"Good","energyScore":82,"recoveryScore":78,"moodDetection":"Calm","hrvStatus":"Optimal","cardiovascularRisk":"Low","overallWellnessScore":83,"healthSummary":"Vitals indicate a healthy cardiovascular profile with good energy and low stress markers."}`;

    try {
      console.log('[Report] Calling Groq directly from browser...');
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a medical wellness AI. Respond ONLY with a flat JSON object. Never wrap in nested keys. Never use markdown.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 800
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      console.log('[Report] Groq response received:', content.slice(0, 150));

      let parsed = JSON.parse(content);
      // Unwrap if model nested everything
      const keys = Object.keys(parsed);
      if (keys.length === 1 && typeof parsed[keys[0]] === 'object') {
        parsed = parsed[keys[0]];
      }

      setAdvancedReport(parsed);
      setShowReport(true);
      setStatus('report_ready');
      console.log('[Report] Report ready!');
    } catch (err) {
      console.error('[Report] Groq call failed:', err);
      setIsGeneratingReport(false);
      setStatus('completed');
    }
  };

  const handleViewReport = async () => {
    if (advancedReport) {
      setShowReport(true);
      return;
    }
    // Generate if not yet done
    setIsGeneratingReport(true);
    await generateAdvancedReport();
    setIsGeneratingReport(false);
  };

  // Timer logic for scanning phase
  const [timeLeft, setTimeLeft] = useState(45);
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'running' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (status === 'running' && timeLeft <= 0) {
      // Scan complete — close WS intentionally so onclose doesn't override our status
      intentionalClose.current = true;
      if (ws.current) ws.current.close(1000, 'Scan Complete');
      cameraService.current.stop();
      onComplete('scan_id_placeholder'); // Trigger App.tsx to award points
      setStatus('analyzing_report');
      generateAdvancedReport();
    }
    
    // Stop camera if scan is completed or errored
    if (status === 'completed' || status === 'error') {
      cameraService.current.stop();
    }
    
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto h-[calc(100vh-100px)]">
      {/* Left Column: Camera Feed & Guidance */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-black rounded-2xl relative overflow-hidden shadow-2xl border border-gray-800 flex-1 min-h-[400px]">
          {/* Dedicated DOM node strictly for manual video appending, untouched by React's diffing */}
          <div ref={videoMountRef} className="absolute inset-0 z-0" />

          <div ref={containerRef} className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {status === 'idle' && (
              <button 
                onClick={startScan}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-full flex items-center gap-3 transition-transform hover:scale-105 pointer-events-auto"
              >
                <Camera className="w-6 h-6" />
                <span className="font-semibold text-lg">Start Health Scan</span>
              </button>
            )}
            {status === 'starting' && (
              <div className="flex flex-col items-center gap-4 text-emerald-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p>Initializing camera...</p>
              </div>
            )}
            {status === 'error' && (
              <div className="flex flex-col items-center gap-4 bg-red-900/90 backdrop-blur-md text-white p-6 rounded-2xl border border-red-500 max-w-sm text-center pointer-events-auto shadow-2xl">
                <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
                <h3 className="text-xl font-bold">Connection Failed</h3>
                <p className="text-sm text-red-200">{errorMsg}</p>
                <button 
                  onClick={() => {
                    setStatus('idle');
                    setErrorMsg('');
                  }}
                  className="mt-4 bg-red-500 hover:bg-red-400 text-white px-6 py-2 rounded-full font-semibold transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
          
            {/* Small Top Overlays (Validation Pills) */}
            {status !== 'idle' && status !== 'error' && status !== 'analyzing_report' && status !== 'report_ready' && status !== 'completed' && (
              <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
                {validation && !validation.isValid && (
                  <div className="bg-red-500/90 backdrop-blur text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg animate-pulse">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{validation.message}</span>
                  </div>
                )}
                {validation && validation.isValid && (
                  <div className="bg-emerald-500/90 backdrop-blur text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Perfect! Keep still.</span>
                  </div>
                )}
              </div>
            )}

            {/* Full Screen Overlays */}
            {status === 'completed' && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-5 rounded-3xl z-40 backdrop-blur-md">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-serif font-bold text-emerald-100">Divination Complete</h3>
                  <p className="text-sm text-emerald-200/50 font-sans mt-1">Your magical essence has been successfully analyzed.</p>
                </div>

                {/* View Report Button — primary CTA */}
                <button
                  onClick={handleViewReport}
                  disabled={isGeneratingReport}
                  className="relative px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500/30 to-amber-600/20 hover:from-amber-500/50 hover:to-amber-600/40 border border-amber-400/50 text-amber-200 font-sans text-base font-bold shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all flex items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isGeneratingReport ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Generating Report...</>
                  ) : (
                    <><FileText className="w-5 h-5" />View Health Report<Sparkles className="w-4 h-4 text-amber-400" /></>
                  )}
                </button>

                <div className="flex items-center gap-3 mt-1">
                  <button
                    onClick={() => {
                      setMetrics(null);
                      setValidation({ code: -1, isValid: false, message: '' });
                      setTimeLeft(45);
                      startScan();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gray-800/60 hover:bg-gray-700/80 border border-gray-600/50 text-gray-300 font-sans text-sm font-semibold transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Scan Again
                  </button>
                  <button
                    onClick={() => onComplete('scan_id_123')}
                    className="px-5 py-2.5 rounded-xl bg-emerald-900/30 hover:bg-emerald-800/40 border border-emerald-700/50 text-emerald-400 font-sans text-sm font-semibold transition-all flex items-center gap-2"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Advanced Report Loading Overlay */}
            {status === 'analyzing_report' && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-6 rounded-3xl z-40 backdrop-blur-md">
                <Loader2 className="w-16 h-16 text-amber-400 animate-spin" />
                <h3 className="text-3xl font-serif font-bold text-amber-200 animate-pulse">Consulting the Oracles...</h3>
                <p className="text-base text-amber-200/80 font-sans max-w-sm text-center">
                  Analyzing your magical essence and gathering dermatological insights.
                </p>
              </div>
            )}

            {/* Advanced Report Modal */}
            {showReport && advancedReport && (
              <DetailedHealthReport
                report={advancedReport}
                onClose={() => {
                  setShowReport(false);
                  if (status === 'report_ready') setStatus('completed');
                }}
              />
            )}
        </div>
      </div>

      {/* Right Column: Metrics Dashboard */}
      <div className="w-full md:w-96 flex-shrink-0">
        <MetricsDashboard metrics={metrics} isRunning={status === 'running'} timeLeft={timeLeft} />
      </div>
    </div>
  );
};
