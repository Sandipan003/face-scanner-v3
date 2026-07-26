import React from 'react';
import { Shield, Cpu, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  const technologies = [
    { name: 'React', desc: 'Modern UI Framework' },
    { name: 'Node.js', desc: 'Express Backend Engine' },
    { name: 'MongoDB', desc: 'Secure Health Data Storage' },
    { name: 'PresageTech', desc: 'rPPG Optical API' },
  ];

  return (
    <footer className="mt-16 border-t border-white/10 bg-neutral-950/80 backdrop-blur-xl text-neutral-400 text-xs py-10 z-10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Core Technology Stack */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-xs uppercase tracking-wider">
              Powered By
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {technologies.map((t, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="font-bold text-emerald-300 text-xs">{t.name}</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Medical Disclaimer Banner */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-neutral-200">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Important Medical Information Disclaimer</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            This LumosHealth application provides informational health metrics based on optical rPPG estimations. It does not provide clinical diagnoses, medical advice, or prescriptions. Always consult a qualified physician or healthcare provider for professional medical diagnosis and treatment decisions.
          </p>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10 text-[11px] text-neutral-500">
          <div className="flex items-center gap-2">
            <span>© 2026 LumosHealth. All rights reserved.</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-neutral-400">
              <Lock className="w-3 h-3 text-emerald-400" /> Encrypted & Privacy-First
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-emerald-400 transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
