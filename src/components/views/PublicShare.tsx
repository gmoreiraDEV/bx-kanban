'use client'


import React, { useState, useEffect } from 'react';
import { db } from '@/db';
import { Page, PageInviteToken } from '@/types';
import { Lock, FileText, Globe, Clock, ShieldAlert, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicSharePageProps {
  token?: string;
}

const PublicSharePage: React.FC<PublicSharePageProps> = ({ token }) => {
  const [invite, setInvite] = useState<PageInviteToken | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState(false);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (token) {
      const t = db.getToken(token);
      if (t) {
        setInvite(t);
        const p = db.getPage(t.pageId, t.tenantId);
        if (p) {
          setPage(p);
          setContent(p.content);
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }
    }
  }, [token]);

  const handleSave = () => {
    if (invite && page && invite.permission === 'edit') {
      setIsSaving(true);
      setTimeout(() => {
        db.updatePage(page.id, page.tenantId, { content });
        setIsSaving(false);
      }, 500);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-12 rounded-[40px] shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-red-50 rounded-[30px] flex items-center justify-center text-red-500 mx-auto mb-6">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Acesso Negado</h1>
          <p className="text-slate-500 font-medium">Este link é inválido ou expirou. Entre em contato com o proprietário da página para solicitar um novo acesso.</p>
          <a href="/login" className="mt-8 inline-block text-blue-600 font-bold hover:underline">Voltar para o App</a>
        </div>
      </div>
    );
  }

  if (!page || !invite) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-16 border-b px-6 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">K</div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 truncate max-w-[200px] md:max-w-xs">{page.title}</h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <Globe className="w-3 h-3" /> Acesso Público • <Clock className="w-3 h-3" /> expira {new Date(invite.expiresAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={cn(
            "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
            invite.permission === 'edit' ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
          )}>
            Modo {invite.permission === 'edit' ? 'Edição' : 'Visualização'}
          </div>
          {invite.permission === 'edit' && (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 flex items-center gap-2"
            >
              {isSaving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Alterações
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
          {invite.permission === 'edit' ? (
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full min-h-[600px] border-none outline-none focus:ring-0 text-slate-700 font-mono leading-relaxed resize-none text-lg"
              placeholder="Comece a editar..."
            />
          ) : (
            <div className="prose prose-slate max-w-none">
              <h1 className="text-4xl font-black text-slate-900 mb-8">{page.title}</h1>
              <div className="whitespace-pre-wrap text-slate-700 text-lg leading-loose font-medium">
                {content}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="h-12 border-t flex items-center justify-center gap-4 bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        <span>Criado com Kanban & Pages Pro</span>
        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
        <a href="/login" className="hover:text-blue-600 transition-colors">Criar sua conta</a>
      </footer>
    </div>
  );
};

export default PublicSharePage;
