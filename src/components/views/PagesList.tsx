'use client'

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, FileText, MoreVertical, Clock, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { stackAuth } from '@/lib/stack-auth';
import { pagesApi } from '@/lib/pagesApi';
import { markdownToPlainText } from '@/lib/markdown';
import { Page } from '@/types';
import TextInputModal from '@/components/ui/TextInputModal';

const PagesListPage: React.FC = () => {
  const router = useRouter();
  const currentSpace = stackAuth.useCurrentSpace();
  const [search, setSearch] = useState('');
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingPage, setIsCreatingPage] = useState(false);

  useEffect(() => {
    if (!currentSpace) return;

    const loadPages = async () => {
      setIsLoading(true);
      try {
        const data = await pagesApi.getPages(currentSpace.id);
        setPages(data);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPages();
  }, [currentSpace]);

  const filteredPages = useMemo(
    () => pages.filter(page => page.title.toLowerCase().includes(search.toLowerCase())),
    [pages, search]
  );

  if (!currentSpace) return null;

  const createPage = async (title: string) => {
    setIsCreatingPage(true);
    try {
      const page = await pagesApi.createPage({
        tenantId: currentSpace.id,
        title,
        content: '# ' + title + '\n\nComece a escrever...',
      });

      setPages(prev => [page, ...prev]);
      setIsCreateModalOpen(false);
      router.push(`/pages/${page.id}`);
    } finally {
      setIsCreatingPage(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Suas Páginas</h1>
          <p className="text-slate-500 font-medium">Documentos, notas e bases de conhecimento.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Nova Página
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6 bg-white p-2 border rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título ou conteúdo..."
            className="w-full pl-10 pr-4 py-2 border-none bg-transparent outline-none text-sm font-medium"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 font-bold border-l">
          <Filter className="w-4 h-4" /> Filtros
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-500 font-medium">Carregando páginas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPages.map(page => (
            <Link
              key={page.id}
              href={`/pages/${page.id}`}
              className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-blue-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2 truncate">{page.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-6 leading-relaxed">
                {markdownToPlainText(page.content).substring(0, 100)}...
              </p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDistanceToNow(new Date(page.updatedAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </div>
                <button className="p-1 hover:bg-slate-100 rounded text-slate-300">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </Link>
          ))}
          {filteredPages.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 border-2 border-dashed rounded-3xl">
              <div className="text-slate-400 mb-4">
                <FileText className="w-12 h-12 mx-auto opacity-20" />
              </div>
              <p className="text-slate-500 font-medium">Nenhuma página encontrada.</p>
            </div>
          )}
        </div>
      )}

      <TextInputModal
        isOpen={isCreateModalOpen}
        title="Nova página"
        description="Defina o título inicial da página."
        label="Título"
        placeholder="Ex: Reunião semanal"
        submitLabel="Criar página"
        isSubmitting={isCreatingPage}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createPage}
      />
    </div>
  );
};

export default PagesListPage;
