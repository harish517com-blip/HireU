import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';

import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { VoiceCriteriaPage } from './pages/VoiceCriteriaPage';
import { ConversationalRecruiterPage } from './pages/ConversationalRecruiterPage';
import { DynamicCriteriaPage } from './pages/DynamicCriteriaPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { FilteredCandidatesPage } from './pages/FilteredCandidatesPage';
import { ProfilePage } from './pages/ProfilePage';
import { AndroidExportPage } from './pages/AndroidExportPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, activeView } = useApp();

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'voice-criteria':
        return <VoiceCriteriaPage />;
      case 'conversational-recruiter':
        return <ConversationalRecruiterPage />;
      case 'dynamic-criteria':
        return <DynamicCriteriaPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'simulator':
        return <SimulatorPage />;
      case 'filtered-candidates':
        return <FilteredCandidatesPage />;
      case 'profile':
        return <ProfilePage />;
      case 'android-export':
        return <AndroidExportPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Navbar */}
        <Navbar />

        {/* Scrollable Main View */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
