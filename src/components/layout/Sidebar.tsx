import React from 'react';
import {
  LayoutDashboard,
  Mic,
  MessageSquareCode,
  SlidersHorizontal,
  BarChart3,
  HelpCircle,
  Users,
  User,
  LogOut,
  Building2,
  Briefcase,
  Smartphone,
} from 'lucide-react';
import { useApp, NavView } from '../../context/AppContext';

interface NavItem {
  id: NavView;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'voice-criteria', label: 'Voice Criteria', icon: Mic },
  { id: 'conversational-recruiter', label: 'AI Recruiter Chat', icon: MessageSquareCode },
  { id: 'dynamic-criteria', label: 'Criteria Modifier', icon: SlidersHorizontal },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'simulator', label: 'What-If Simulator', icon: HelpCircle },
  { id: 'filtered-candidates', label: 'Candidates Pool', icon: Users },
  { id: 'android-export', label: 'Android APK / AAB', icon: Smartphone, badge: 'APK/AAB' },
  { id: 'profile', label: 'Profile Settings', icon: User },
];

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, currentUser, logout, job } = useApp();

  return (
    <aside id="app-sidebar" className="w-60 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0 border-r border-slate-800 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
          H
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white leading-tight">
            HireU
          </h1>
          <p className="text-[10px] text-slate-400 font-medium">
            Screening Copilot
          </p>
        </div>
      </div>

      {/* Current Job Role Indicator */}
      <div className="mx-3 mt-3 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
        <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-0.5">
          <Briefcase className="w-3 h-3" />
          <span>Active Role</span>
        </div>
        <p className="text-xs font-semibold text-slate-200 truncate">{job.title}</p>
        <p className="text-[10px] text-slate-400 truncate">{job.department}</p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User & Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
          <div className="flex items-center space-x-2.5 truncate">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {currentUser?.fullName?.charAt(0) || 'H'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{currentUser?.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser?.companyName}</p>
            </div>
          </div>
          <button
            id="sidebar-logout-btn"
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

