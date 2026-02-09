'use client'


import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/db';
import { stackAuth } from '@/lib/stack-auth';
import { Share2, ArrowLeft, Save, Trash2, Eye, Edit3 } from 'lucide-react';
import ShareModal from '@/components/Pages/ShareModal';
import { Page } from '@/types';

interface PageDetailPageProps {
  pageId?: string;
}

const PageDetailPage: React.FC<PageDetailPageProps> = ({ pageId }) => {
  const router = useRouter();
  const currentSpace = stackAuth.useCurrentSpace();
  const [page, setPage] = useState<Page | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (pageId && currentSpace) {
      const p = db.getPage(pageId, currentSpace.id);
      if (p) {
        setPage(p);
        setContent(p.content);
        setTitle(p.title);
      } else {
        router.push('/pages');
      }
    }
  }, [pageId, currentSpace, router]);

  const savePage = () => {
    if (page && currentSpace) {
      db.updatePage(page.id, currentSpace.id, { title, content });
      alert('Página salva com sucesso!');
    }
  };

  const deletePage = () => {
    if (page && currentSpace && confirm('Excluir esta página?')) {
      db.deletePage(page.id, currentSpace.id);
      router.push('/pages');
    }
  };

  if (!page) return null;

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="h-16 border-b px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/pages')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-bold text-slate-800 outline-none border-none p-0 focus:ring-0 w-64 md:w-96"
          />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50 border rounded-lg transition-colors"
          >
            {isEditing ? <><Eye className="w-4 h-4" /> Preview</> : <><Edit3 className="w-4 h-4" /> Edit</>}
          </button>
          <button 
            onClick={() => setIsSharing(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors font-medium"
          >
            <Share2 className="w-4 h-4" /> Compartilhar
          </button>
          <button 
            onClick={savePage}
            className="flex items-center gap-2 px-4 py-1.5 text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            <Save className="w-4 h-4" /> Salvar
          </button>
          <button 
            onClick={deletePage}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 md:p-12">
        <div className="max-w-4xl mx-auto min-h-full">
          {isEditing ? (
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full min-h-[500px] outline-none border-none p-0 focus:ring-0 text-slate-700 font-mono leading-relaxed resize-none"
              placeholder="Digite aqui em markdown..."
            />
          ) : (
            <div className="prose prose-slate max-w-none">
              <h1 className="text-4xl font-black text-slate-900 mb-8">{title}</h1>
              <div className="whitespace-pre-wrap text-slate-600 leading-loose">
                {content}
              </div>
            </div>
          )}
        </div>
      </div>

      {isSharing && pageId && (
        <ShareModal pageId={pageId} onClose={() => setIsSharing(false)} />
      )}
    </div>
  );
};

export default PageDetailPage;
