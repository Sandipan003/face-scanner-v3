import React from 'react';
import { 
  Activity, Camera, FileText, MessageSquareText, Stethoscope, 
  LayoutDashboard, LogOut, ChevronRight, Menu, X, ShieldCheck 
} from 'lucide-react';
import { User } from '../types';

export type TabType = 'dashboard' | 'scanner' | 'analyzer' | 'chat' | 'brief';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  user: User;
  onLogout: () => void;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  user,
  onLogout,
  isOpenMobile,
  onToggleMobile
}) => {
  const menuItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard & Vitals',
      icon: LayoutDashboard,
      badge: 'Overview',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    },
    {
      id: 'scanner' as TabType,
      label: 'Face rPPG Scanner',
      icon: Camera,
      badge: 'Live',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    },
    {
      id: 'analyzer' as TabType,
      label: 'Medical OCR Analyzer',
      icon: FileText,
      badge: 'Gemini AI',
      badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20'
    },
    {
      id: 'chat' as TabType,
      label: 'AI Health Companion',
      icon: MessageSquareText,
      badge: 'RAG',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    },
    {
      id: 'brief' as TabType,
      label: 'Doctor Brief Prep',
      icon: Stethoscope,
      badge: 'Clinical',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    }
  ];

  return (
    <>
      {/* Mobile Top Header Toggle */}
      <div className="lg:hidden sticky top-0 z-40 w-full bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-white text-lg tracking-tight">Swast AI</span>
        </div>
        <button
          onClick={onToggleMobile}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white"
        >
          {isOpenMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for Mobile Drawer */}
      {isOpenMobile && (
        <div 
          onClick={onToggleMobile} 
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40" 
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-neutral-950/80 border-r border-white/10 backdrop-blur-2xl flex flex-col justify-between p-5 transition-transform duration-300 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="space-y-8">
          {/* Logo / Brand Header */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Swast AI</h2>
              <span className="text-[10px] font-mono text-neutral-400 block -mt-1">Health Intelligence</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-3 block mb-2">
              Healthcare Modules
            </span>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (isOpenMobile) onToggleMobile();
                  }}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all group relative overflow-hidden
                    ${isActive 
                      ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white border border-indigo-500/40 shadow-lg shadow-indigo-500/10' 
                      : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-400' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
                    <span>{item.label}</span>
                  </div>

                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Info & Footer */}
        <div className="pt-6 border-t border-white/10 space-y-4">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center font-bold text-white text-sm shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-white truncate">{user.name}</span>
                <span className="text-[10px] text-neutral-400 font-mono truncate">{user.email}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 px-2 text-[10px] text-neutral-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>HIPAA Protected Data</span>
          </div>
        </div>
      </aside>
    </>
  );
};
