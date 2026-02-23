'use client'

import React, { useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column as ColumnType, Card as CardType } from '@/types';
import Card from './Card';
import { stackAuth } from '@/lib/stack-auth';
import { kanbanApi } from '@/lib/kanbanApi';
import { Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newAssignedUserId, setNewAssignedUserId] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'Column', column },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const addCard = async () => {
    if (!currentSpace || isAddingCard) return;

    const trimmedTitle = newCardTitle.trim();
    if (!trimmedTitle) return;

    setIsAddingCard(true);
    try {
      await kanbanApi.createCard({
        tenantId: currentSpace.id,
        boardId: column.boardId,
        columnId: column.id,
        title: trimmedTitle,
        description: '',
        assignedUserId: newAssignedUserId || null,
        dueDate: newDueDate || null,
        position: cards.length,
      });
      setIsAddCardModalOpen(false);
      setNewCardTitle('');
      setNewAssignedUserId('');
      setNewDueDate('');
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
        'w-80 flex-shrink-0 flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200/60 max-h-full',
        isDragging && 'opacity-50'
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

      {isAddCardModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddCardModalOpen(false)}></div>
          <div className="relative w-full max-w-xl overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col">
            <div className="h-14 px-5 border-b flex items-center justify-between flex-shrink-0">
              <h2 className="text-sm font-semibold text-slate-700">Novo card</h2>
              <button onClick={() => setIsAddCardModalOpen(false)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Título</label>
                <input
                  value={newCardTitle}
                  onChange={event => setNewCardTitle(event.target.value)}
                  placeholder="Ex: Definir critérios de aceite"
                  className="mt-2 w-full border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Responsável</label>
                <select
                  value={newAssignedUserId}
                  onChange={event => setNewAssignedUserId(event.target.value)}
                  className="mt-2 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sem responsável</option>
                  {(currentSpace?.members ?? []).map(member => (
                    <option key={member.userId} value={member.userId}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data estimada de entrega</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={event => setNewDueDate(event.target.value)}
                  className="mt-2 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="h-16 px-5 border-t flex items-center justify-end gap-2 flex-shrink-0 bg-white">
              <button
                onClick={addCard}
                disabled={isAddingCard || !newCardTitle.trim()}
                className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {isAddingCard ? 'Criando...' : 'Criar card'}
              </button>
            </div>
          </div>
        </div>
      )}

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
