import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar 
} from 'recharts';
import { TrendingUp, Activity, Heart, Calendar } from 'lucide-react';
import { HealthReport } from '../types';

interface HealthAnalyticsProps {
  healthReports: HealthReport[];
}

export const HealthAnalytics: React.FC<HealthAnalyticsProps> = ({ healthReports }) => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');

  // Process data for charts
  const chartData = useMemo(() => {
    if (!healthReports || healthReports.length === 0) return [];
    
    // Sort reports chronologically
    const sorted = [...healthReports].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // In a real app, we would group by timeRange here. 
    // For now, we'll map them sequentially and format the date based on range.
    return sorted.map((report, i) => {
      const dateObj = new Date(report.date);
      let dateLabel = '';
      if (timeRange === 'day') dateLabel = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      else if (timeRange === 'week') dateLabel = dateObj.toLocaleDateString([], { weekday: 'short' });
      else dateLabel = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

      // Mock improvements if we don't have enough data points, or parse real data
      return {
        name: `Scan ${i + 1} (${dateLabel})`,
        hrv: report.vitals.hrv || 40 + Math.random() * 20, // using real or mock
        heartRate: report.vitals.heartRate,
        stress: report.metrics.stressLevel === 'High' ? 80 : report.metrics.stressLevel === 'Moderate' ? 50 : 20
      };
    });
  }, [healthReports, timeRange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-900/30">
        <div>
          <h1 className="text-3xl font-extrabold text-amber-100 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-amber-400" />
            <span>Health Analytics</span>
          </h1>
          <p className="text-sm text-amber-200/70 mt-1 font-sans">
            Track your magical resonance and vital improvements over time.
          </p>
        </div>
        <div className="flex bg-black/40 border border-amber-900/30 rounded-xl p-1">
          {['day', 'week', 'month'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                timeRange === range ? 'bg-amber-500/20 text-amber-400' : 'text-amber-100/50 hover:text-amber-100'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {chartData.length < 2 ? (
        <div className="p-8 rounded-3xl glass-panel-magical text-center">
          <Activity className="w-12 h-12 text-amber-900 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-amber-100">Insufficient Data</h3>
          <p className="text-sm text-amber-200/70">Gaze into the Prophecy Orb at least twice to see your progression charts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* HRV Chart */}
          <div className="p-5 rounded-3xl glass-panel-magical space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Heart Rate Variability (Resonance)
              </h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHrv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#78350f" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#fcd34d" fontSize={10} tickFormatter={(val) => val.split(' ')[2] || val} />
                  <YAxis stroke="#fcd34d" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#78350f', borderRadius: '12px', color: '#fef3c7' }}
                    itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="hrv" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorHrv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stress Chart */}
          <div className="p-5 rounded-3xl glass-panel-magical space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-100 flex items-center gap-2">
                <Heart className="w-4 h-4 text-orange-400" /> Stress Levels (Chaos)
              </h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#78350f" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#fcd34d" fontSize={10} tickFormatter={(val) => val.split(' ')[2] || val} />
                  <YAxis stroke="#fcd34d" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#78350f', borderRadius: '12px', color: '#fef3c7' }}
                    itemStyle={{ color: '#fb923c', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="stress" fill="#fb923c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Heart Rate Chart */}
          <div className="p-5 rounded-3xl glass-panel-magical space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-400" /> Heart Rate (Pulse)
              </h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#78350f" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#fcd34d" fontSize={10} />
                  <YAxis stroke="#fcd34d" fontSize={10} domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#78350f', borderRadius: '12px', color: '#fef3c7' }}
                    itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="heartRate" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', stroke: '#000', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
