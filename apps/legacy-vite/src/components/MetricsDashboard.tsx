import React from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Activity, Heart, Wind, Brain } from 'lucide-react';

type MetricsProps = {
  metrics: any;
  isRunning: boolean;
  timeLeft?: number;
};

export const MetricsDashboard = ({ metrics, isRunning, timeLeft }: MetricsProps) => {
  // Extract values from SDK arrays (taking the latest measurement)
  const lastPulse = metrics?.cardio?.pulseRate?.[metrics.cardio.pulseRate.length - 1];
  const heartRate = lastPulse ? Math.round(lastPulse.value) : '--';
  const confidence = lastPulse?.confidence ? Math.round(lastPulse.confidence) : 0;

  const lastResp = metrics?.breathing?.rate?.[metrics.breathing.rate.length - 1];
  const respRate = lastResp ? Math.round(lastResp.value) : '--';

  const lastHrv = metrics?.cardio?.hrv?.[metrics.cardio.hrv.length - 1];
  const hrv = (lastHrv?.sdnn !== undefined && lastHrv?.sdnn !== null && !isNaN(lastHrv.sdnn)) 
    ? Math.round(lastHrv.sdnn) 
    : (lastHrv?.value !== undefined && lastHrv?.value !== null && !isNaN(lastHrv.value))
    ? Math.round(lastHrv.value)
    : '--';

  // Extract pulse waveform for the chart
  const pulseTrace = metrics?.cardio?.arterialPressureTrace || [];
  const chartData = pulseTrace.length > 0 
    ? pulseTrace.slice(-50).map((pt: any, i: number) => ({ time: i, hr: pt.value }))
    : [
        { time: 0, hr: 70 },
        { time: 1, hr: 72 },
        { time: 2, hr: 71 },
        { time: 3, hr: 75 },
        { time: 4, hr: 73 },
      ];

  return (
    <div className="bg-[#0f1115] text-white p-6 rounded-2xl border border-gray-800 shadow-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-100 flex items-center gap-3">
          <Activity className="w-6 h-6 text-emerald-400" />
          Vital Metrics
        </h2>
        {isRunning && (
          <div className="flex items-center gap-4">
            {timeLeft !== undefined && (
              <div className="text-sm font-mono text-emerald-400 bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-500/20">
                00:{timeLeft.toString().padStart(2, '0')}
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-900/30 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Analyzing
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <MetricCard 
          title="Heart Rate" 
          value={heartRate} 
          unit="bpm" 
          icon={<Heart className="w-5 h-5 text-rose-500" />} 
          color="border-rose-500/20 bg-rose-500/5"
        />
        <MetricCard 
          title="Respiratory Rate" 
          value={respRate} 
          unit="rpm" 
          icon={<Wind className="w-5 h-5 text-cyan-500" />} 
          color="border-cyan-500/20 bg-cyan-500/5"
        />
        <MetricCard 
          title="Blood Pressure Changes" 
          value={metrics?.cardio?.bloodPressure ? `${Math.round(metrics.cardio.bloodPressure.systolic)}/${Math.round(metrics.cardio.bloodPressure.diastolic)}` : '--'} 
          unit="mmHg" 
          icon={<Activity className="w-5 h-5 text-violet-500" />} 
          color="border-violet-500/20 bg-violet-500/5"
        />
        <MetricCard 
          title="Signal Confidence" 
          value={confidence} 
          unit="%" 
          icon={<Brain className="w-5 h-5 text-amber-500" />} 
          color="border-amber-500/20 bg-amber-500/5"
        />
      </div>

      <div className="flex-1 min-h-[200px] bg-[#15181e] rounded-xl p-4 border border-gray-800/50 relative overflow-hidden">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Real-time Trend</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
            <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tick={false} />
            <YAxis stroke="#6b7280" fontSize={12} domain={['dataMin', 'dataMax']} tickFormatter={() => ''} width={10} />
            <Line 
              type="monotone" 
              dataKey="hr" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={false}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
        
        {!isRunning && heartRate === '--' && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <p className="text-gray-400 font-medium">Awaiting scan data...</p>
          </div>
        )}
        {!isRunning && heartRate !== '--' && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
            <div className="bg-emerald-900/40 backdrop-blur-sm border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-full font-semibold shadow-xl">
              Scan Complete
            </div>
          </div>
        )}
      </div>
      
      <p className="text-center text-xs text-gray-500 mt-6">
        This is a wellness application. Do not use for medical diagnosis.
      </p>
    </div>
  );
};

const MetricCard = ({ title, value, unit, icon, color }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`p-4 rounded-xl border ${color} flex flex-col`}
  >
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-sm font-medium text-gray-400">{title}</span>
    </div>
    <div className="flex items-baseline gap-1 mt-auto">
      <span className="text-3xl font-bold text-gray-100">{value}</span>
      <span className="text-sm font-medium text-gray-500">{unit}</span>
    </div>
  </motion.div>
);
