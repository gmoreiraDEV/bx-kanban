'use client'


import React, { useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column as ColumnType, Card as CardType } from '@/types';
import Card from './Card';
import { stackAuth } from '@/lib/stack-auth';
import { kanbanApi } from '@/lib/kanbanApi';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import TextInputModal from '@/components/ui/TextInputModal';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface ColumnProps {
  column: ColumnType;
  cards: CardType[];
  onUpdate: () => void;
}

const Column: React.FC<ColumnProps> = ({ column, cards, onUpdate }) => {
  const currentSpace = stackAuth.useCurrentSpace();
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [isDeleteColumnModalOpen, setIsDeleteColumnModalOpen] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isDeletingColumn, setIsDeletingColumn] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'Column', column },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const addCard = async (title: string) => {
    if (!currentSpace || isAddingCard) return;

    setIsAddingCard(true);
    try {
      await kanbanApi.createCard({
        tenantId: currentSpace.id,
        boardId: column.boardId,
        columnId: column.id,
        title,
        description: '',
        position: cards.length
      });
      setIsAddCardModalOpen(false);
      onUpdate();
    } finally {
      setIsAddingCard(false);
    }
  };

  const removeColumn = async () => {
    if (isDeletingColumn) return;

    setIsDeletingColumn(true);
    try {
      await kanbanApi.deleteColumn(column.id);
      setIsDeleteColumnModalOpen(false);
      onUpdate();
    } finally {
      setIsDeletingColumn(false);
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "w-80 flex-shrink-0 flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200/60 max-h-full",
        isDragging && "opacity-50"
      )}
    >
      <div className="p-4 flex items-center justify-between group">
        <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
          <h3 className="font-semibold text-slate-700 text-sm tracking-wide uppercase">{column.title}</h3>
          <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {cards.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsAddCardModalOpen(true)} className="p-1 hover:bg-white rounded transition-colors text-slate-400 hover:text-blue-600">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => setIsDeleteColumnModalOpen(true)} className="p-1 hover:bg-white rounded transition-colors text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[150px]">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <Card key={card.id} card={card} onUpdate={onUpdate} />
          ))}
        </SortableContext>
      </div>

      <button 
        onClick={() => setIsAddCardModalOpen(true)}
        className="mx-3 mb-3 mt-1 flex items-center gap-2 p-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors bg-white/50 hover:bg-white border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl"
      >
        <Plus className="w-3.5 h-3.5" /> Adicionar Card
      </button>

      <TextInputModal
        isOpen={isAddCardModalOpen}
        title="Novo card"
        description={`Adicione um card na coluna "${column.title}".`}
        label="Título do card"
        placeholder="Ex: Definir critérios de aceite"
        submitLabel="Criar card"
        isSubmitting={isAddingCard}
        onClose={() => setIsAddCardModalOpen(false)}
        onSubmit={addCard}
      />
      <ConfirmModal
        isOpen={isDeleteColumnModalOpen}
        title="Excluir coluna"
        description={`Deseja excluir a coluna "${column.title}" e todos os cards dela?`}
        confirmLabel="Excluir coluna"
        tone="danger"
        isConfirming={isDeletingColumn}
        onClose={() => setIsDeleteColumnModalOpen(false)}
        onConfirm={removeColumn}
      />
    </div>
  );
};

export default Column;
