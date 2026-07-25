import React, { useEffect, useRef, useState } from 'react';
import { CameraService } from '../services/CameraService';
import { FaceValidator, ValidationStatus } from '../services/FaceValidator';
import { MetricsDashboard } from './MetricsDashboard';
import { AlertCircle, Camera, CheckCircle2, Loader2 } from 'lucide-react';

export const ScannerFlow = ({ token, onComplete }: { token: string; onComplete: (scanId: string) => void }) => {
  const [status, setStatus] = useState<'idle' | 'starting' | 'validating' | 'running' | 'completed' | 'error'>('idle');
  const [validation, setValidation] = useState<ValidationStatus | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
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

    if (containerRef.current) {
      const vid = cameraService.current.getVideoElement();
      vid.className = 'w-full h-full object-cover rounded-xl transform scale-x-[-1]';
      videoRef.current = vid;
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(vid);
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
        if (valStatus.isValid && status !== 'running') {
          setStatus('running');
        }
      } else if (msg.type === 'metrics') {
        setMetrics(msg.data);
      } else if (msg.type === 'error') {
        setStatus('error');
        setErrorMsg(msg.message || 'An error occurred during scanning');
      }
    };

    ws.current.onclose = () => {
      if (status === 'running') {
        setStatus('completed');
        onComplete('scan_id_placeholder'); // In a real app, backend would send scan ID
      }
    };
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto h-[calc(100vh-100px)]">
      {/* Left Column: Camera Feed & Guidance */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-black rounded-2xl relative overflow-hidden shadow-2xl border border-gray-800 flex-1 min-h-[400px]">
          <div ref={containerRef} className="absolute inset-0 flex items-center justify-center">
            {status === 'idle' && (
              <button 
                onClick={startScan}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-full flex items-center gap-3 transition-transform hover:scale-105"
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
          </div>
          
          {/* Overlays */}
          {status !== 'idle' && status !== 'error' && (
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
        </div>
      </div>

      {/* Right Column: Dashboard */}
      <div className="flex-[1.5]">
        <MetricsDashboard metrics={metrics} isRunning={status === 'running'} />
      </div>
    </div>
  );
};
