import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain, Heart, Activity, Droplet, Shield, X } from 'lucide-react';

interface DetailedHealthReportProps {
  report: any;
  onClose: () => void;
}

export const DetailedHealthReport = ({ report, onClose }: DetailedHealthReportProps) => {
  const wellness = report.overallWellnessScore ?? report.energyScore ?? 75;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="absolute inset-0 z-50 bg-[#0a0c10] rounded-3xl overflow-y-auto border border-amber-500/20 shadow-[0_0_60px_rgba(245,158,11,0.1)] p-6 flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400 flex-shrink-0" />
            Biometric Health Report
          </h2>
          <p className="text-gray-500 text-sm mt-1">AI-powered wellness analysis from facial scan</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700 text-gray-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/5 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-5">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke="#374151" strokeWidth="8" />
            <circle
              cx="40" cy="40" r="32" fill="none"
              stroke={wellness >= 80 ? '#10b981' : wellness >= 60 ? '#f59e0b' : '#ef4444'}
              strokeWidth="8"
              strokeDasharray={`${(wellness / 100) * 201} 201`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">{wellness}</span>
            <span className="text-[9px] text-gray-400">/ 100</span>
          </div>
        </div>
        <div>
          <p className="text-amber-300 font-semibold text-base">Overall Wellness Score</p>
          {report.healthSummary && (
            <p className="text-gray-300 text-sm mt-1 leading-relaxed">{report.healthSummary}</p>
          )}
          {report.cardiovascularRisk && (
            <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
              report.cardiovascularRisk === 'Low' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30' :
              report.cardiovascularRisk === 'Moderate' ? 'bg-amber-900/40 text-amber-300 border border-amber-500/30' :
              'bg-red-900/40 text-red-300 border border-red-500/30'
            }`}>
              Cardiovascular Risk: {report.cardiovascularRisk}
            </span>
          )}
        </div>
      </div>

      {/* Grid of sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Cardiovascular */}
        <ReportSection title="Cardiovascular" icon={<Heart className="w-4 h-4 text-rose-400" />} color="rose">
          <ReportItem label="HRV Status" value={report.hrvStatus} />
          <ReportItem label="CV Risk" value={report.cardiovascularRisk} />
        </ReportSection>

        {/* Mental & Energy */}
        <ReportSection title="Mental & Energy" icon={<Brain className="w-4 h-4 text-violet-400" />} color="violet">
          <ReportItem label="Energy Score" value={report.energyScore} unit="/ 100" />
          <ReportItem label="Recovery Score" value={report.recoveryScore} unit="/ 100" />
          <ReportItem label="Fatigue" value={report.fatigueScore !== undefined ? `${report.fatigueScore}/100` : null} />
          <ReportItem label="Stress Level" value={report.stressLevel} />
          <ReportItem label="Mood" value={report.moodDetection} />
          <ReportItem label="Sleep Quality" value={report.sleepQualityEstimation} />
        </ReportSection>

        {/* Skin & Dermatology */}
        <ReportSection title="Skin & Dermatology" icon={<Droplet className="w-4 h-4 text-cyan-400" />} color="cyan">
          <ReportItem label="Skin Age" value={report.skinAge} unit="yrs" />
          <ReportItem label="Skin Tone" value={report.skinTone} />
          <ReportItem label="Hydration" value={report.hydration} />
          <ReportItem label="Wrinkles" value={report.wrinkles} />
          <ReportItem label="Pigmentation" value={report.pigmentation} />
          <ReportItem label="Dark Circles" value={report.darkCircles} />
        </ReportSection>

        {/* Facial Morphology */}
        <ReportSection title="Facial Morphology" icon={<Activity className="w-4 h-4 text-emerald-400" />} color="emerald">
          <ReportItem label="Face Shape" value={report.faceShape} />
          <ReportItem label="Symmetry" value={report.facialSymmetry} />
          <ReportItem label="Jawline" value={report.jawlineDefinition} />
          <ReportItem label="Face Fat %" value={report.faceFatPercentage} unit="%" />
          <ReportItem label="Est. Body Fat" value={report.bodyFatEstimation} unit="%" />
          <ReportItem label="Double Chin" value={report.doubleChinDetection} />
          <ReportItem label="Neck Fat" value={report.neckFat} />
        </ReportSection>

      </div>

      <p className="text-center text-xs text-gray-600 pb-2">
        This report is for informational purposes only and is not a substitute for professional medical advice.
      </p>
    </motion.div>
  );
};

const ReportSection = ({ title, icon, color, children }: any) => {
  const border: Record<string, string> = {
    rose: 'border-rose-500/20 bg-rose-500/5',
    violet: 'border-violet-500/20 bg-violet-500/5',
    cyan: 'border-cyan-500/20 bg-cyan-500/5',
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
  };
  return (
    <div className={`p-4 rounded-2xl border ${border[color]} flex flex-col gap-2`}>
      <h3 className="text-sm font-bold text-gray-300 flex items-center gap-1.5 mb-1">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
};

const ReportItem = ({ label, value, unit }: { label: string; value: any; unit?: string }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-semibold text-gray-200 text-right max-w-[55%]">
        {value}{unit ? <span className="text-gray-500 ml-0.5 font-normal">{unit}</span> : null}
      </span>
    </div>
  );
};
