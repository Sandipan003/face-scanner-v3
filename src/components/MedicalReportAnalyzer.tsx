import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, Sparkles, CheckCircle2, AlertTriangle, HelpCircle, Shield, RefreshCw } from 'lucide-react';

interface LabEntity {
  name: string;
  value: string;
  unit: string;
  range: string;
  status: 'normal' | 'high' | 'low' | 'critical';
}

interface AnalysisResult {
  summary: string;
  explanation: string;
  entities: LabEntity[];
  keyFindings: string[];
  questionsForDoctor: string[];
  confidenceScore: number;
  disclaimer: string;
}

export const MedicalReportAnalyzer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      setPreviewUrl(resultStr);
      setBase64Data(resultStr);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const payload = {
        imageBase64: base64Data,
        mimeType: selectedFile?.type || 'image/png',
        fileName: selectedFile?.name || 'Medical_Report.png'
      };

      const res = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze report');
      }

      setResult({
        summary: data.summary,
        explanation: data.explanation,
        entities: data.entities || [],
        keyFindings: data.keyFindings || [],
        questionsForDoctor: data.questionsForDoctor || [],
        confidenceScore: data.confidenceScore || 0.95,
        disclaimer: data.disclaimer || 'Informational analysis only.'
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred during report analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Medical Report OCR Analyzer</span>
              <span className="text-[10px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/30 px-2 py-0.5 rounded-full">
                Gemini Vision
              </span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">Upload blood tests or lab reports to extract lab markers & get plain language summaries</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-neutral-900/40 border border-white/10 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Upload Lab Document / Image</h3>

            {/* Drop Zone */}
            <label className="border-2 border-dashed border-white/10 hover:border-teal-500/40 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-white/5 hover:bg-white/10 group">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <div className="p-3 rounded-full bg-teal-500/10 text-teal-400 mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white">Click or drag report image here</span>
              <span className="text-[10px] text-neutral-500 mt-1">Supports PNG, JPEG, WEBP lab scans</span>
            </label>

            {/* Image Preview */}
            {previewUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black max-h-56 flex items-center justify-center">
                <img src={previewUrl} alt="Report preview" className="max-h-56 object-contain" />
                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-mono text-teal-400 border border-white/10">
                  {selectedFile?.name}
                </div>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting Entities with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Report with Gemini Vision</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Results Workspace */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl space-y-6"
            >
              {/* Executive Summary */}
              <div className="space-y-2 pb-4 border-b border-white/10">
                <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider block">Executive Summary</span>
                <h4 className="text-lg font-bold text-white">{result.summary}</h4>
                <p className="text-xs text-neutral-300 leading-relaxed pt-1">{result.explanation}</p>
              </div>

              {/* Extracted Entities Grid */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Extracted Lab Markers</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {result.entities.map((ent, idx) => {
                    const statusColor = 
                      ent.status === 'high' || ent.status === 'critical' 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : ent.status === 'low'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';

                    return (
                      <div key={idx} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-neutral-400 truncate">{ent.name}</span>
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${statusColor}`}>
                            {ent.status}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-extrabold text-white font-mono">{ent.value}</span>
                          <span className="text-[9px] text-neutral-500 font-bold">{ent.unit}</span>
                        </div>
                        <span className="text-[9px] text-neutral-500 block">Ref: {ent.range}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Findings */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider block">Key Findings</span>
                <ul className="space-y-2">
                  {result.keyFindings.map((finding, idx) => (
                    <li key={idx} className="text-xs text-neutral-300 flex items-start gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Questions for Doctor */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">Suggested Questions for Doctor</span>
                <div className="space-y-2">
                  {result.questionsForDoctor.map((q, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15 text-xs text-neutral-300 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>"{q}"</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-neutral-500 italic pt-4 border-t border-white/10 text-center">
                {result.disclaimer}
              </p>
            </motion.div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-neutral-900/40 border border-white/10 border-dashed flex flex-col items-center justify-center space-y-3">
              <FileText className="w-12 h-12 text-neutral-600" />
              <h4 className="text-sm font-bold text-white">No Report Selected</h4>
              <p className="text-xs text-neutral-400 max-w-xs">Upload an image of a lab report or blood work on the left to analyze lab metrics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
