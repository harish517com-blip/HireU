import React from 'react';
import { Smartphone, Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const { currentUser, setActiveView } = useApp();

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setActiveView('android-export')}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 transition-colors text-xs font-semibold"
          title="Get Android APK / AAB Build Files"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
          <span>Get Android APK / AAB</span>
          <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Ready
          </span>
        </button>
      </div>

      {/* User Profile */}
      <button
        onClick={() => setActiveView('profile')}
        className="flex items-center space-x-2.5 text-xs focus:outline-none hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
          {currentUser?.fullName?.charAt(0) || 'H'}
        </div>
        <div className="text-left leading-tight">
          <p className="font-semibold text-slate-800">{currentUser?.fullName}</p>
          <p className="text-[10px] text-slate-500">{currentUser?.role || 'Recruiter'}</p>
        </div>
      </button>
    </header>
  );
};


