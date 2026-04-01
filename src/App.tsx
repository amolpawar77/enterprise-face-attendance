import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Registration } from './components/Registration';
import { Kiosk } from './components/Kiosk';
import { Reports } from './components/Reports';
import { EmployeeManagement } from './components/EmployeeManagement';
import { loadModels } from './lib/face';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await loadModels();
        setModelsLoaded(true);
      } catch (error) {
        console.error("Failed to load models:", error);
      }
    };
    init();
  }, []);

  if (!modelsLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
        <Loader2 size={64} className="animate-spin text-blue-600 mb-6" />
        <h2 className="text-3xl font-bold">Initializing AI Models</h2>
        <p className="text-slate-500 mt-3 text-lg">Loading face recognition neural networks...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'register' && <Registration />}
        {activeTab === 'kiosk' && <Kiosk />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'employees' && <EmployeeManagement />}
      </main>
    </div>
  );
}
