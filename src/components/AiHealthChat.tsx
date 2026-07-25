import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User as UserIcon, Sparkles, RefreshCw, Shield, BookOpen } from 'lucide-react';
import { HealthReport } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  citations?: string[];
  confidence?: number;
}

interface AiHealthChatProps {
  healthReports: HealthReport[];
}

export const AiHealthChat: React.FC<AiHealthChatProps> = ({ healthReports }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! I am your GuardianOS AI Health Companion. I have access to your verified rPPG vitals graph and report history. How can I help you today?',
      citations: ['rPPG Vitals Graph', 'Stored Reports History'],
      confidence: 0.98
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const quickPrompts = [
    'Summarize my recent vitals trends',
    'What does my HRV score mean?',
    'How can I lower my stress level?',
    'Are my heart rate scans normal?'
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsSending(true);

    try {
      // Build health context payload from reports
      const healthContext = {
        scanCount: healthReports.length,
        latestVitals: healthReports.length > 0 ? healthReports[0].vitals : null,
        conditionStatus: healthReports.length > 0 ? healthReports[0].conditionStatus : 'Normal',
        reportsSummary: healthReports.slice(0, 5).map(r => ({
          date: r.date,
          bpm: r.vitals.heartRate,
          hrv: r.vitals.hrv,
          stress: r.vitals.stressLevel
        }))
      };

      const res = await fetch('/api/health-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          healthContext
        })
      });
      const data = await res.json();

      if (data.success) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.reply,
          citations: data.citations || ['Health Graph Context'],
          confidence: data.confidence || 0.95
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>AI Health Companion</span>
              <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
                RAG Grounded
              </span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">Interactive medical assistant grounded in your stored biometric scans and lab data</p>
          </div>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="p-6 rounded-3xl bg-neutral-900/40 border border-white/10 backdrop-blur-xl space-y-6">
        {/* Messages Stream */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg'
                  : 'bg-white/5 border border-white/10 text-neutral-200 rounded-tl-none'
              }`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-white/10 flex items-center gap-2 flex-wrap text-[9px] font-mono text-purple-300">
                    <BookOpen className="w-3 h-3" />
                    <span>Citations:</span>
                    {msg.citations.map((c, i) => (
                      <span key={i} className="bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-1">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-purple-400 p-3 bg-purple-500/5 rounded-2xl w-fit">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing health context & generating answer...</span>
            </div>
          )}
        </div>

        {/* Quick Prompt Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-[10px] font-mono text-neutral-500 uppercase shrink-0">Quick Queries:</span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 px-3 py-1.5 rounded-full shrink-0 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="text"
            placeholder="Ask anything about your health trends, vitals, or lab metrics..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={isSending || !inputMessage.trim()}
            className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
