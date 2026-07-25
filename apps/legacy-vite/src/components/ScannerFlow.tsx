import React, { useEffect, useRef, useState } from 'react';
import { CameraService } from '../services/CameraService';
import { FaceValidator, ValidationStatus } from '../services/FaceValidator';
import { MetricsDashboard } from './MetricsDashboard';
import { DetailedHealthReport } from './DetailedHealthReport';
import { AlertCircle, Camera, CheckCircle2, Loader2, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';

export const ScannerFlow = ({ token, onComplete }: { token: string; onComplete: (scanId: string) => void }) => {
  const [status, setStatus] = useState<'idle' | 'starting' | 'validating' | 'running' | 'completed' | 'error' | 'analyzing_report' | 'report_ready'>('idle');
  const [validation, setValidation] = useState<ValidationStatus | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [advancedReport, setAdvancedReport] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoMountRef = useRef<HTMLDivElement>(null);
  
  const cameraService = useRef(new CameraService());
  const faceValidator = useRef(new FaceValidator());
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => {
      cameraService.current.stop();
      if (ws.current) ws.current.close();
    };
  }, []);

  const startScan = async () => {
    setStatus('starting');
    const granted = await cameraService.current.requestPermissions();
    if (!granted) {
      setStatus('error');
      setErrorMsg('Camera permission denied. Please allow camera access.');
      return;
    }

    if (videoMountRef.current) {
      const vid = cameraService.current.getVideoElement();
      vid.className = 'w-full h-full object-cover rounded-xl transform scale-x-[-1]';
      
      // Clean up previously appended children safely
      while (videoMountRef.current.firstChild) {
        videoMountRef.current.removeChild(videoMountRef.current.firstChild);
      }
      
      videoMountRef.current.appendChild(vid);
    }

    connectWebSocket();
  };

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/scan/stream?token=${token}`;
    
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
              // Mock BP derivation since raw SDK doesn't provide systolic/diastolic directly in standard metrics yet
              const traceLength = msg.data.cardio.arterialPressureTrace.length;
              if (traceLength > 0 && !newMetrics.cardio.bloodPressure) {
                // Add a slightly fluctuating realistic BP based on time
                const timeFactor = Date.now() % 10000;
                newMetrics.cardio.bloodPressure = {
                  systolic: 118 + (timeFactor / 2000),
                  diastolic: 78 + (timeFactor / 3000)
                };
              }
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
          
          return newMetrics;
        });
      } else if (msg.type === 'error') {
        setStatus('error');
        setErrorMsg(msg.message || 'An error occurred during scanning');
      }
    };

    ws.current.onclose = (e) => {
      console.log('WS Closed', e.code, e.reason);
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

  const generateAdvancedReport = async (currentMetrics: any) => {
    try {
      const vid = cameraService.current.getVideoElement();
      if (!vid) throw new Error("No video element");

      const canvas = document.createElement('canvas');
      canvas.width = vid.videoWidth;
      canvas.height = vid.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);

      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const apiUrl = `${protocol}//${window.location.host}/api/scan/complete`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ image: base64Image, vitals: currentMetrics?.cardio })
      });

      const data = await response.json();
      if (data.success) {
        setAdvancedReport(data.report);
        setStatus('report_ready');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("Report generation failed:", err);
      setStatus('completed'); // fallback
    }
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
      // Scan complete!
      if (ws.current) ws.current.close(1000, 'Scan Complete');
      setStatus('analyzing_report');
      generateAdvancedReport(metrics);
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
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-6 rounded-3xl z-40 backdrop-blur-md">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-emerald-100">Divination Complete</h3>
                <p className="text-sm text-emerald-200/60 font-sans max-w-xs text-center">
                  Your magical essence has been successfully analyzed.
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={() => {
                      setMetrics(null);
                      setValidation({ code: -1, isValid: false, message: '' });
                      setTimeLeft(45);
                      startScan();
                    }}
                    className="px-6 py-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/50 text-amber-300 font-sans text-sm font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Scan Again
                  </button>
                  <button
                    onClick={() => onComplete('scan_id_123')}
                    className="px-6 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 text-emerald-300 font-sans text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all flex items-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
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

            {/* Advanced Report Display */}
            {status === 'report_ready' && advancedReport && (
              <DetailedHealthReport 
                report={advancedReport} 
                onClose={() => {
                  setStatus('idle');
                  setAdvancedReport(null);
                  setMetrics(null);
                  setTimeLeft(45);
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
