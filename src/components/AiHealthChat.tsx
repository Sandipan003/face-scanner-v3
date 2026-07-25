import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Wand2, User as UserIcon, Sparkles, RefreshCw, Shield, BookOpen } from 'lucide-react';
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
      text: 'Greetings! I am the Portrait of the Healer. I have access to your magical aura vitals and past divination history. How may I assist you today?',
      citations: ['Prophecy Orb Vitals', 'Stored Divination History'],
      confidence: 0.98
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const quickPrompts = [
    'Summarize my recent magical aura trends',
    'What does my Resonance score mean?',
    'How can I lower my cursed stress level?',
    'Are my Prophecy Orb scans normal?'
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
          citations: data.citations || ['Magical Graph Context'],
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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="p-6 rounded-[2rem] glass-panel-magical flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-600/10 border border-amber-500/20 text-amber-400">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-100 flex items-center gap-2 font-serif">
              <span>Portrait of the Healer</span>
              <span className="text-[10px] font-mono bg-purple-900/40 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
                Magically Grounded
              </span>
            </h2>
            <p className="text-xs text-amber-200/70 mt-0.5">Interactive medical portrait grounded in your stored magical scans and potion recipes</p>
          </div>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="p-6 rounded-[2rem] bg-black/40 border border-amber-900/30 backdrop-blur-xl space-y-6 shadow-inner">
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
                <div className="w-8 h-8 rounded-xl bg-amber-600/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-1">
                  <Wand2 className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 font-sans ${
                msg.sender === 'user'
                  ? 'bg-amber-800 text-amber-50 rounded-tr-none shadow-[0_0_15px_rgba(245,158,11,0.2)] border border-amber-700/50'
                  : 'bg-black/60 border border-amber-900/50 text-amber-100 rounded-tl-none'
              }`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-amber-900/30 flex items-center gap-2 flex-wrap text-[9px] font-sans font-bold tracking-widest uppercase text-amber-500">
                    <BookOpen className="w-3 h-3" />
                    <span>References:</span>
                    {msg.citations.map((c, i) => (
                      <span key={i} className="bg-amber-900/40 px-2 py-0.5 rounded border border-amber-700/30">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-red-900/30 border border-red-500/30 text-amber-200 flex items-center justify-center shrink-0 mt-1">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-amber-400 p-3 bg-amber-900/20 border border-amber-900/30 rounded-2xl w-fit font-sans">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Consulting the ancient texts...</span>
            </div>
          )}
        </div>

        {/* Quick Prompt Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 font-sans">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest shrink-0">Quick Queries:</span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-[11px] bg-black/40 hover:bg-amber-900/30 border border-amber-900/40 hover:border-amber-500/30 text-amber-200/80 hover:text-amber-100 px-3 py-1.5 rounded-full shrink-0 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-3 pt-2 font-sans">
          <input
            type="text"
            placeholder="Ask anything about your magical aura, vitals, or potions..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-black/50 border border-amber-900/50 rounded-2xl px-4 py-3 text-xs text-amber-100 placeholder:text-amber-700/50 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={isSending || !inputMessage.trim()}
            className="p-3 rounded-2xl bg-gradient-to-r from-amber-700 to-red-800 hover:from-amber-600 hover:to-red-700 text-amber-50 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all disabled:opacity-50 border border-amber-500/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
