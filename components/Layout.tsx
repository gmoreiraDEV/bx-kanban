
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { stackAuth } from '../services/stack-auth';
import { LogOut, User, Bell, Search, Plus, Settings } from 'lucide-react';

const Layout: React.FC = () => {
  const user = stackAuth.useUser();
  const currentSpace = stackAuth.useCurrentSpace();
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname.includes('/boards')) return 'Boards';
    if (location.pathname.includes('/pages')) return 'Pages';
    if (location.pathname.includes('/settings')) return 'Settings';
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-white px-6 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-800">{getPageTitle()}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-64 outline-none"
              />
            </div>
            
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-700">{user?.name}</p>
                <p className="text-xs text-slate-400 capitalize">{currentSpace?.name}</p>
              </div>
              <div className="relative group">
                <button className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border-2 border-transparent group-hover:border-blue-500 transition-all">
                  {user?.name.charAt(0)}
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-2 hidden group-hover:block z-50">
                  <Link to="/app/settings/members" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                    <Settings className="w-4 h-4" /> Space Settings
                  </Link>
                  <button 
                    onClick={() => stackAuth.logout()}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
