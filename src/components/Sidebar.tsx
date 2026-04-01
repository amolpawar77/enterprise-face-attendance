import React from 'react';
import { Users, Camera, LayoutDashboard, BarChart3, Settings } from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'register', label: 'Register Employee', icon: Users },
    { id: 'kiosk', label: 'Kiosk Mode', icon: Camera },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'employees', label: 'Manage Employees', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col shrink-0">
      <div className="p-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Camera className="text-blue-400" />
          FaceAttend Pro
        </h1>
        <p className="text-xs text-slate-400 mt-1">Enterprise Edition</p>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 text-center">v2.0 Professional</p>
      </div>
    </div>
  );
}
