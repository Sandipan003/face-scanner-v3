import React from 'react';
import { 
  Sparkles, Camera, BookOpen, MessageSquareText, Stethoscope, 
  LayoutDashboard, LogOut, ChevronRight, Menu, X, ShieldCheck, Wand2, Eye
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
      label: 'The Great Hall',
      icon: LayoutDashboard,
      badge: 'Overview',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    },
    {
      id: 'scanner' as TabType,
      label: 'Prophecy Orb',
      icon: Eye,
      badge: 'Divination',
      badgeColor: 'bg-red-800/20 text-red-400 border-red-500/20'
    },
    {
      id: 'analyzer' as TabType,
      label: 'Ancient Scrolls',
      icon: BookOpen,
      badge: 'Translation',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'chat' as TabType,
      label: 'Portrait Healer',
      icon: MessageSquareText,
      badge: 'Consult',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    },
    {
      id: 'brief' as TabType,
      label: 'Healer\'s Prep',
      icon: Stethoscope,
      badge: 'Records',
      badgeColor: 'bg-amber-700/20 text-amber-300 border-amber-600/30'
    }
  ];

  return (
    <>
      {/* Mobile Top Header Toggle */}
      <div className="lg:hidden sticky top-0 z-40 w-full bg-black/80 backdrop-blur-xl border-b border-amber-900/30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Wand2 className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-amber-100 text-lg tracking-tight font-serif">Ministry of Magic</span>
        </div>
        <button
          onClick={onToggleMobile}
          className="p-2 rounded-xl bg-black/40 border border-amber-900/40 text-amber-200/60 hover:text-amber-100"
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
        fixed lg:sticky top-0 left-0 z-50 h-screen w-72 glass-panel-magical !border-y-0 !border-l-0 !border-r border-r-amber-900/40 flex flex-col justify-between p-5 transition-transform duration-300 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="space-y-8">
          {/* Logo / Brand Header */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-600 to-red-800 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.3)] border border-amber-500/40">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-amber-100 tracking-tight font-serif">Ministry of Magic</h2>
              <span className="text-[10px] font-sans font-bold text-amber-400 block tracking-widest uppercase mt-0.5">Identity Division</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.2em] px-3 block mb-2 font-sans">
              Magical Departments
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
                    w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all group relative overflow-hidden font-sans
                    ${isActive 
                      ? 'bg-gradient-to-r from-amber-900/40 to-red-900/30 text-amber-100 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]' 
                      : 'text-amber-200/60 hover:text-amber-100 hover:bg-white/5 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-amber-400' : 'text-amber-900/60 group-hover:text-amber-200/80'}`} />
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
        <div className="pt-6 border-t border-amber-900/30 space-y-4">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-900/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-black text-sm shrink-0 font-serif">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-amber-100 truncate font-serif">{user.name}</span>
                <span className="text-[10px] text-amber-200/60 font-sans truncate">{user.email}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-black/60 hover:bg-red-900/30 text-amber-200/50 hover:text-red-400 transition-colors shrink-0 border border-transparent hover:border-red-900/50"
              title="Disapparate (Sign Out)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 px-2 text-[10px] text-amber-600 font-sans tracking-widest uppercase font-bold">
            <ShieldCheck className="w-3 h-3 text-amber-500" />
            <span>Magically Sealed</span>
          </div>
        </div>
      </aside>
    </>
  );
};
