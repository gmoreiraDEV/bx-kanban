'use client'


import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import TextInputModal from '@/components/ui/TextInputModal';

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const currentSpace = stackAuth.useCurrentSpace();
  const spaces = stackAuth.useSpaces();
  const [isSpaceSelectorOpen, setIsSpaceSelectorOpen] = useState(false);
  const [isCreateSpaceModalOpen, setIsCreateSpaceModalOpen] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);

  const navItems = [
    { label: 'Boards', path: '/boards', icon: Trello },
    { label: 'Pages', path: '/pages', icon: FileText },
    { label: 'Membros', path: '/settings/members', icon: Users },
  ];

  const handleCreateSpace = async (name: string) => {
    setIsCreatingSpace(true);
    try {
      await stackAuth.createSpace(name);
      setIsCreateSpaceModalOpen(false);
      setIsSpaceSelectorOpen(false);
    } finally {
      setIsCreatingSpace(false);
    }
  };

  return (
    <aside className="w-64 border-r bg-slate-900 text-slate-300 flex flex-col flex-shrink-0">
      <div className="p-6">
        <div className="mb-8">
          <Image
            src="/img/logo-h.png"
            alt="Forge"
            width={540}
            height={120}
            className="h-8 w-auto"
            priority
          />
        </div>

        {/* Space Switcher */}
        <div className="relative mb-8">
          <button 
            onClick={() => setIsSpaceSelectorOpen(!isSpaceSelectorOpen)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors text-sm"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 bg-slate-600 rounded flex items-center justify-center text-[10px] flex-shrink-0">
                {(currentSpace?.name ?? '..').substring(0, 2).toUpperCase()}
              </div>
              <span className="truncate">{currentSpace?.name ?? 'Sem espaço'}</span>
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
                onClick={() => setIsCreateSpaceModalOpen(true)}
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

      <TextInputModal
        isOpen={isCreateSpaceModalOpen}
        title="Novo espaço"
        description="Crie um novo espaço de trabalho."
        label="Nome do espaço"
        placeholder="Ex: Produto"
        submitLabel="Criar espaço"
        isSubmitting={isCreatingSpace}
        onClose={() => setIsCreateSpaceModalOpen(false)}
        onSubmit={handleCreateSpace}
      />
    </aside>
  );
};

export default Sidebar;
