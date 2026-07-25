import React from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Activity, Heart, Wind, Brain } from 'lucide-react';

type MetricsProps = {
  metrics: any;
  isRunning: boolean;
};

export const MetricsDashboard = ({ metrics, isRunning }: MetricsProps) => {
  // Extract values with fallbacks
  const heartRate = metrics?.cardio?.heartRate?.value || '--';
  const respRate = metrics?.breathing?.respiratoryRate?.value || '--';
  const hrv = metrics?.cardio?.hrv?.sdnn || '--';
  const confidence = metrics?.confidence || 0;

  // Mock historical data array for the chart (in a real app, accumulate metrics.pulseWaveform)
  const chartData = [
    { time: '0s', hr: 70 },
    { time: '1s', hr: 72 },
    { time: '2s', hr: 71 },
    { time: '3s', hr: 75 },
    { time: '4s', hr: 73 },
  ];

  return (
    <div className="bg-[#0f1115] text-white p-6 rounded-2xl border border-gray-800 shadow-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-100 flex items-center gap-3">
          <Activity className="w-6 h-6 text-emerald-400" />
          Vital Metrics
        </h2>
        {isRunning && (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-900/30 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Analyzing
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
          title="HRV (SDNN)" 
          value={hrv} 
          unit="ms" 
          icon={<Activity className="w-5 h-5 text-violet-500" />} 
          color="border-violet-500/20 bg-violet-500/5"
        />
        <MetricCard 
          title="Signal Confidence" 
          value={confidence * 100} 
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
            <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} domain={['dataMin - 5', 'dataMax + 5']} />
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
        
        {!isRunning && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <p className="text-gray-400 font-medium">Awaiting scan data...</p>
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
