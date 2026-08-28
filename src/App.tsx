import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Dashboard } from './screens/Dashboard';
import { DeceasedList } from './screens/DeceasedList';
import { NewDeceased } from './screens/NewDeceased';
import { DeceasedDetail } from './screens/DeceasedDetail';
import { Fridge } from './screens/Fridge';
import { Statistics } from './screens/Statistics';
import { Reports } from './screens/Reports';
import { ArchiveView } from './screens/ArchiveView';
import { ArchivePDFGenerator } from './screens/ArchivePDFGenerator';
import { AmputeeList } from './screens/AmputeeList';
import { NewAmputee } from './screens/NewAmputee';
import { AmputeeDetail } from './screens/AmputeeDetail';
import { HistoricalDeceased } from './screens/HistoricalDeceased';
import { Settings } from './screens/Settings';
import { Login } from './screens/Login';
import { QuickSearch } from './components/layout/QuickSearch';
import { OperatorProfileModal } from './components/modals/OperatorProfileModal';
import { useData } from './hooks/useData';

import { ThemeProvider } from './context/ThemeContext';

function AppContent() {
  const { user, loading, showNameModal, setShowNameModal } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [selectedDeceasedId, setSelectedDeceasedId] = useState<string | null>(null);
  const [selectedAmputeeId, setSelectedAmputeeId] = useState<string | null>(null);
  
  const data = useData(user);

  if (loading || data.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006050]"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleSelectFromSearch = (id: string) => {
    setSelectedDeceasedId(id);
    setCurrentScreen('deceased-detail');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <Dashboard data={data} onNavigate={setCurrentScreen} onSelectDeceased={(id) => { setSelectedDeceasedId(id); setCurrentScreen('deceased-detail'); }} />;
      case 'deceased':
        return <DeceasedList data={data} onNavigate={setCurrentScreen} onSelectDeceased={(id) => { setSelectedDeceasedId(id); setCurrentScreen('deceased-detail'); }} />;
      case 'new':
        return <NewDeceased data={data} onComplete={() => setCurrentScreen('dashboard')} />;
      case 'frigo':
        return <Fridge data={data} onNavigate={setCurrentScreen} onSelectDeceased={(id) => { setSelectedDeceasedId(id); setCurrentScreen('deceased-detail'); }} />;
      case 'reports':
        if (user?.role !== 'admin') {
          return <Dashboard data={data} onNavigate={setCurrentScreen} onSelectDeceased={(id) => { setSelectedDeceasedId(id); setCurrentScreen('deceased-detail'); }} />;
        }
        return <Reports data={data} onNavigate={setCurrentScreen} />;
      case 'archive-view':
        return <ArchiveView data={data} onNavigate={setCurrentScreen} onSelectDeceased={(id) => { setSelectedDeceasedId(id); setCurrentScreen('deceased-detail'); }} />;
      case 'archive-pdf-generator':
        return <ArchivePDFGenerator data={data} onNavigate={setCurrentScreen} />;
      case 'statistics':
        if (user?.role !== 'admin') {
          return <Dashboard data={data} onNavigate={setCurrentScreen} onSelectDeceased={(id) => { setSelectedDeceasedId(id); setCurrentScreen('deceased-detail'); }} />;
        }
        return <Statistics data={data} onNavigate={setCurrentScreen} />;
      case 'settings':
        return <Settings data={data} onNavigate={setCurrentScreen} onOpenProfile={() => setShowNameModal(true)} onCleanupAll={data.cleanupAllHistoricalData} />;
      case 'historical-deceased':
        return <HistoricalDeceased data={data} onNavigate={setCurrentScreen} />;
      case 'deceased-detail':
        const record = data.deceased.find((d: any) => d.id === selectedDeceasedId);
        if (!record) return <DeceasedList data={data} onNavigate={setCurrentScreen} onSelectDeceased={(id) => { setSelectedDeceasedId(id); setCurrentScreen('deceased-detail'); }} />;
        return <DeceasedDetail record={record} users={data.users} onBack={() => setCurrentScreen('deceased')} onExit={(exitData) => data.registerExit(record.id, exitData)} onUpdateIdentity={async (identityData) => { await data.updateDeceasedIdentity(record.id, identityData); }} onDelete={() => data.deleteDeceasedRecord(record.id)} />;
      case 'amputee':
        return <AmputeeList data={data} onNavigate={setCurrentScreen} onSelectAmputee={(id) => { setSelectedAmputeeId(id); setCurrentScreen('amputee-detail'); }} />;
      case 'new-amputee':
        return <NewAmputee data={data} onComplete={() => setCurrentScreen('amputee')} />;
      case 'amputee-detail':
        const amputee = data.amputees.find((a: any) => a.id === selectedAmputeeId);
        if (!amputee) return <AmputeeList data={data} onNavigate={setCurrentScreen} onSelectAmputee={(id) => { setSelectedAmputeeId(id); setCurrentScreen('amputee-detail'); }} />;
        return <AmputeeDetail record={amputee} users={data.users} onBack={() => setCurrentScreen('amputee')} onDelete={() => data.deleteAmputeeRecord(amputee.id)} />;
      default:
        return <Dashboard data={data} onNavigate={setCurrentScreen} onSelectDeceased={(id) => { setSelectedDeceasedId(id); setCurrentScreen('deceased-detail'); }} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen theme-bg-app pb-24 transition-colors duration-300">
      <OperatorProfileModal 
        isOpen={showNameModal} 
        onClose={() => setShowNameModal(false)} 
      />
      <main className="flex-1 p-6 overflow-y-auto">
        {currentScreen !== 'new' && currentScreen !== 'login' && (
          <QuickSearch records={data.deceased} onSelect={handleSelectFromSearch} />
        )}
        {renderScreen()}
      </main>
      <Navbar currentScreen={currentScreen} onNavigate={setCurrentScreen} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
