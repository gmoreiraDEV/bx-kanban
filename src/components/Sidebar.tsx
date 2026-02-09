'use client'


import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { stackAuth } from '@/lib/stack-auth';
import { 
  Trello, 
  FileText, 
  ChevronDown, 
  Plus, 
  Check, 
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const currentSpace = stackAuth.useCurrentSpace();
  const spaces = stackAuth.useSpaces();
  const [isSpaceSelectorOpen, setIsSpaceSelectorOpen] = useState(false);

  const navItems = [
    { label: 'Boards', path: '/boards', icon: Trello },
    { label: 'Pages', path: '/pages', icon: FileText },
    { label: 'Membros', path: '/settings/members', icon: Users },
  ];

  return (
    <aside className="w-64 border-r bg-slate-900 text-slate-300 flex flex-col flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">K</div>
          <span className="font-bold text-white text-lg tracking-tight">KanbanPro</span>
        </div>

        {/* Space Switcher */}
        <div className="relative mb-8">
          <button 
            onClick={() => setIsSpaceSelectorOpen(!isSpaceSelectorOpen)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors text-sm"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 bg-slate-600 rounded flex items-center justify-center text-[10px] flex-shrink-0">
                {currentSpace?.name.substring(0, 2).toUpperCase()}
              </div>
              <span className="truncate">{currentSpace?.name}</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 transition-transform", isSpaceSelectorOpen && "rotate-180")} />
          </button>

          {isSpaceSelectorOpen && (
            <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Seus Espaços</div>
              {spaces.map(space => (
                <button
                  key={space.id}
                  onClick={() => {
                    stackAuth.switchSpace(space.id);
                    setIsSpaceSelectorOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-700 text-left transition-colors"
                >
                  <span className={cn(currentSpace?.id === space.id ? "text-blue-400 font-medium" : "text-slate-300")}>
                    {space.name}
                  </span>
                  {currentSpace?.id === space.id && <Check className="w-4 h-4 text-blue-400" />}
                </button>
              ))}
              <div className="h-px bg-slate-700 my-2"></div>
              <button 
                onClick={() => {
                  const name = prompt('Nome do novo espaço:');
                  if (name) stackAuth.createSpace(name);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-slate-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Novo Espaço
              </button>
            </div>
          )}
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group",
                pathname.startsWith(item.path) 
                  ? "bg-blue-600 text-white font-medium" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4",
                pathname.startsWith(item.path) ? "text-white" : "text-slate-500 group-hover:text-slate-300"
              )} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Espaço Livre</span>
            <span className="text-[10px] font-bold text-blue-400">Pro</span>
          </div>
          <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
            <div className="w-2/3 bg-blue-500 h-full"></div>
          </div>
          <p className="text-[10px] mt-2 text-slate-500 leading-tight">Você está usando 80% do armazenamento do espaço.</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
