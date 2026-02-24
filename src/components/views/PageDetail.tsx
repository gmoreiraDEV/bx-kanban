'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, ArrowLeft, Save, Trash2, Eye, Edit3, History } from 'lucide-react';

import ShareModal from '@/components/Pages/ShareModal';
import MarkdownRenderer from '@/components/Pages/MarkdownRenderer';
import RichTextEditor from '@/components/Pages/RichTextEditor';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { stackAuth } from '@/lib/stack-auth';
import { pagesApi } from '@/lib/pagesApi';
import { Page, PageVersion } from '@/types';

interface PageDetailPageProps {
  pageId?: string;
}

const AUTOSAVE_DELAY_MS = 1200;

const PageDetailPage: React.FC<PageDetailPageProps> = ({ pageId }) => {
  const router = useRouter();
  const currentSpace = stackAuth.useCurrentSpace();
  const [page, setPage] = useState<Page | null>(null);
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [editorMode, setEditorMode] = useState<'rich' | 'markdown'>('rich');
  const [content, setContent] = useState('');
  const [editorStateJson, setEditorStateJson] = useState('{}');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastSavedSignature, setLastSavedSignature] = useState('');

  useEffect(() => {
    if (!pageId || !currentSpace) return;

    const loadPage = async () => {
      setIsLoading(true);
      try {
        const payload = await pagesApi.getPage(pageId, currentSpace.id);
        setPage(payload.data);
        setVersions(payload.versions);
        setContent(payload.data.content);
        setTitle(payload.data.title);
        setEditorStateJson(payload.data.editorStateJson || '{}');
        setLastSavedSignature(`${payload.data.title}::${payload.data.content}::${payload.data.editorStateJson || '{}'}`);
        setEditorMode('rich');
      } catch {
        router.push('/pages');
      } finally {
        setIsLoading(false);
      }
    };

    void loadPage();
  }, [pageId, currentSpace, router]);

  const savePayload = useMemo(
    () => ({ title, content, editorStateJson }),
    [title, content, editorStateJson]
  );

  const savePage = async (isManual = true) => {
    if (!page || !currentSpace) return;

    setIsSaving(true);
    try {
      const updated = await pagesApi.updatePage(page.id, {
        tenantId: currentSpace.id,
        ...savePayload,
      });
      setPage(updated);
      const signature = `${updated.title}::${updated.content}::${updated.editorStateJson}`;
      setLastSavedSignature(signature);
      if (isManual) setIsSavedModalOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!page || !currentSpace) return;
    const nextSignature = `${title}::${content}::${editorStateJson}`;
    if (nextSignature === lastSavedSignature) return;

    const timeout = window.setTimeout(() => {
      void savePage(false);
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [page, currentSpace, title, content, editorStateJson, lastSavedSignature]);

  const deletePage = async () => {
    if (!page || !currentSpace || isDeleting) return;

    setIsDeleting(true);
    try {
      await pagesApi.deletePage(page.id, currentSpace.id);
      setIsDeleteModalOpen(false);
      router.push('/pages');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-slate-500">Carregando página...</div>;
  }

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
            onChange={e => setTitle(e.target.value)}
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
            onClick={() => void savePage(true)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-1.5 text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-70"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 md:p-12">
        <div className="max-w-5xl mx-auto min-h-full grid gap-6 lg:grid-cols-[1fr_280px]">
          <div>
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1 bg-slate-50 w-fit">
                  <button
                    type="button"
                    onClick={() => setEditorMode('rich')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      editorMode === 'rich'
                        ? 'bg-white text-slate-800 shadow-sm font-semibold'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Rich Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('markdown')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      editorMode === 'markdown'
                        ? 'bg-white text-slate-800 shadow-sm font-semibold'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Markdown
                  </button>
                </div>

                {editorMode === 'rich' ? (
                  <RichTextEditor
                    key={page.id}
                    value={content}
                    onChange={setContent}
                    onEditorStateJsonChange={setEditorStateJson}
                    placeholder="Comece a escrever..."
                    minHeightClassName="min-h-[560px]"
                  />
                ) : (
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full h-full min-h-[560px] border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-mono leading-relaxed resize-none"
                    placeholder="Digite aqui em markdown..."
                  />
                )}
              </div>
            ) : (
              <div className="max-w-none">
                <h1 className="text-4xl font-black text-slate-900 mb-8">{title}</h1>
                <MarkdownRenderer content={content} />
              </div>
            )}
          </div>

          <aside className="border border-slate-200 rounded-xl p-4 h-fit bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-700 mb-3">
              <History className="w-4 h-4" />
              <h3 className="font-semibold">Histórico (simples)</h3>
            </div>
            <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
              {versions.length === 0 ? (
                <p className="text-xs text-slate-500">Sem versões salvas ainda.</p>
              ) : (
                versions.map(version => (
                  <button
                    type="button"
                    key={version.id}
                    onClick={() => setContent(version.content)}
                    className="w-full text-left p-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50"
                  >
                    <div className="text-xs text-slate-700 font-medium">
                      {new Date(version.createdAt).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{version.content.slice(0, 80) || '(vazio)'}</div>
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>

      {isSharing && pageId && (
        <ShareModal pageId={pageId} onClose={() => setIsSharing(false)} />
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Excluir página"
        description="Deseja realmente excluir esta página?"
        confirmLabel="Excluir página"
        tone="danger"
        isConfirming={isDeleting}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={deletePage}
      />
      <ConfirmModal
        isOpen={isSavedModalOpen}
        title="Página salva"
        description="As alterações foram salvas com sucesso."
        confirmLabel="OK"
        hideCancel
        onClose={() => setIsSavedModalOpen(false)}
        onConfirm={() => setIsSavedModalOpen(false)}
      />
    </div>
  );
};

export default PageDetailPage;
