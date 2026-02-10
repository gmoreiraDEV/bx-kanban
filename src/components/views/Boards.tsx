'use client'


import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Edit3, FolderKanban, Plus, Trash2 } from 'lucide-react';
import { stackAuth } from '@/lib/stack-auth';
import { kanbanApi } from '@/lib/kanbanApi';
import KanbanBoard from '@/components/Kanban/Board';
import { Board } from '@/types';
import TextInputModal from '@/components/ui/TextInputModal';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface BoardsPageProps {
  boardId?: string;
}

const OPEN_CREATE_BOARD_EVENT = 'boards:create';

const BoardsPage: React.FC<BoardsPageProps> = ({ boardId }) => {
  const router = useRouter();
  const currentSpace = stackAuth.useCurrentSpace();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isMutatingBoardId, setIsMutatingBoardId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [boardToRename, setBoardToRename] = useState<Board | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);

  const loadBoards = useCallback(async () => {
    if (!currentSpace) {
      setBoards([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await kanbanApi.getBoards(currentSpace.id);
      setBoards(data);
    } finally {
      setIsLoading(false);
    }
  }, [currentSpace]);

  useEffect(() => {
    void loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    const openCreateModal = () => {
      setIsCreateModalOpen(true);
    };

    window.addEventListener(OPEN_CREATE_BOARD_EVENT, openCreateModal);
    return () => {
      window.removeEventListener(OPEN_CREATE_BOARD_EVENT, openCreateModal);
    };
  }, []);

  const selectedBoard = useMemo(
    () => (boardId ? boards.find(board => board.id === boardId) : undefined),
    [boardId, boards]
  );
  const orderedBoards = useMemo(
    () =>
      [...boards].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [boards]
  );

  const createBoard = async (title: string) => {
    if (!currentSpace || isCreating) return;
    setIsCreating(true);
    try {
      const created = await kanbanApi.createBoard({ tenantId: currentSpace.id, title });
      setBoards(prev => [created, ...prev.filter(board => board.id !== created.id)]);
      setIsCreateModalOpen(false);
      router.push(`/boards/${created.id}`);
    } finally {
      setIsCreating(false);
    }
  };

  const renameBoard = async (board: Board, title: string) => {
    if (!currentSpace || isMutatingBoardId || isCreating) return;
    if (!title) return;
    if (title === board.title) {
      setBoardToRename(null);
      return;
    }

    setIsMutatingBoardId(board.id);
    try {
      const updated = await kanbanApi.updateBoard(board.id, {
        tenantId: currentSpace.id,
        title,
      });
      setBoards(prev => prev.map(item => (item.id === board.id ? updated : item)));
      setBoardToRename(null);
    } finally {
      setIsMutatingBoardId(null);
    }
  };

  const deleteBoard = async (board: Board) => {
    if (!currentSpace || isMutatingBoardId || isCreating) return;

    setIsMutatingBoardId(board.id);
    try {
      await kanbanApi.deleteBoard(board.id, currentSpace.id);
      let nextBoards: Board[] = [];
      setBoards(prev => {
        nextBoards = prev.filter(item => item.id !== board.id);
        return nextBoards;
      });

      if (boardId === board.id) {
        if (nextBoards.length > 0) {
          router.replace(`/boards/${nextBoards[0].id}`);
        } else {
          router.replace('/boards');
        }
      }
      setBoardToDelete(null);
    } finally {
      setIsMutatingBoardId(null);
    }
  };

  if (!currentSpace) return null;

  const renderBoardCard = (board: Board) => {
    const isActive = board.id === boardId;
    const isBusy = isMutatingBoardId === board.id;

    return (
      <div
        key={board.id}
        className={`rounded-2xl border p-4 transition-colors ${
          isActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">{board.title}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Atualizado em {new Date(board.updatedAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <FolderKanban className="w-5 h-5 text-slate-300" />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => router.push(`/boards/${board.id}`)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Abrir
          </button>
          <button
            onClick={() => setBoardToRename(board)}
            disabled={isBusy}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Renomear ${board.title}`}
            title="Renomear"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setBoardToDelete(board)}
            disabled={isBusy}
            className="p-1.5 rounded-lg border border-slate-200 text-red-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Excluir ${board.title}`}
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (!boardId) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gerenciar Boards</h1>
            <p className="text-slate-500 font-medium">Crie, abra, renomeie ou exclua seus boards.</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={isCreating}
            className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Novo Board
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-500 font-medium">Carregando boards...</div>
        ) : boards.length === 0 ? (
          <div className="py-20 text-center bg-slate-50 border-2 border-dashed rounded-3xl">
            <p className="text-slate-500 font-medium">Você ainda não tem boards neste espaço.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Criar primeiro board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orderedBoards.map(renderBoardCard)}
          </div>
        )}

        <TextInputModal
          isOpen={isCreateModalOpen}
          title="Novo board"
          description="Crie um board para organizar seu fluxo de trabalho."
          label="Nome do board"
          placeholder="Ex: Sprint de Produto"
          submitLabel="Criar board"
          isSubmitting={isCreating}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={createBoard}
        />
        <TextInputModal
          isOpen={Boolean(boardToRename)}
          title="Renomear board"
          description="Atualize o nome do board."
          label="Nome do board"
          submitLabel="Salvar nome"
          initialValue={boardToRename?.title ?? ''}
          isSubmitting={Boolean(isMutatingBoardId)}
          onClose={() => setBoardToRename(null)}
          onSubmit={async title => {
            if (!boardToRename) return;
            await renameBoard(boardToRename, title);
          }}
        />
        <ConfirmModal
          isOpen={Boolean(boardToDelete)}
          title="Excluir board"
          description={`Deseja excluir "${boardToDelete?.title ?? ''}"? Esta ação remove também colunas e cards.`}
          confirmLabel="Excluir board"
          tone="danger"
          isConfirming={Boolean(isMutatingBoardId)}
          onClose={() => setBoardToDelete(null)}
          onConfirm={async () => {
            if (!boardToDelete) return;
            await deleteBoard(boardToDelete);
          }}
        />
      </div>
    );
  }

  if (isLoading && !selectedBoard) {
    return <div className="p-10 text-center text-slate-500">Carregando board...</div>;
  }

  if (!selectedBoard) {
    return (
      <div className="p-10 text-center text-slate-500">
        <p>Board não encontrado ou você não tem acesso.</p>
        <button
          onClick={() => router.push('/boards')}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          Voltar para gestão de boards <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <KanbanBoard boardId={selectedBoard.id} boardTitle={selectedBoard.title} />
      </div>

      <TextInputModal
        isOpen={isCreateModalOpen}
        title="Novo board"
        description="Crie um board para organizar seu fluxo de trabalho."
        label="Nome do board"
        placeholder="Ex: Sprint de Produto"
        submitLabel="Criar board"
        isSubmitting={isCreating}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createBoard}
      />
    </div>
  );
};

export default BoardsPage;
