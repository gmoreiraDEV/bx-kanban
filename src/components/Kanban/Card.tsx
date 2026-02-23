'use client'

import React, { useMemo, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare, MoreHorizontal, User } from 'lucide-react';

import { Card as CardType } from '@/types';
import { cn } from '@/lib/utils';
import { stackAuth } from '@/lib/stack-auth';

import CardModal from './CardModal';

interface CardProps {
  card: CardType;
  onUpdate: () => void;
}

const formatDueDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;

  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const Card: React.FC<CardProps> = ({ card, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentSpace = stackAuth.useCurrentSpace();

  const assignedMember = useMemo(
    () => currentSpace?.members.find(member => member.userId === card.assignedUserId),
    [card.assignedUserId, currentSpace?.members]
  );

  const dueDateLabel = card.dueDate ? formatDueDate(card.dueDate) : null;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'Card', card },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setIsModalOpen(true)}
        className={cn(
          'bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 hover:border-blue-400 transition-all cursor-grab active:cursor-grabbing group select-none',
          isDragging && 'opacity-30 border-blue-600 border-2'
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-medium text-slate-800 leading-tight">{card.title}</p>
          <button
            onClick={event => {
              event.stopPropagation();
              setIsModalOpen(true);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {card.description && (
          <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            {card.description}
          </p>
        )}

        {(assignedMember || dueDateLabel) && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {assignedMember && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                <User className="w-3 h-3" /> {assignedMember.name}
              </span>
            )}
            {dueDateLabel && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                <Calendar className="w-3 h-3" /> {dueDateLabel}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-1 text-slate-400">
            <MessageSquare className="w-3 h-3" />
            <span className="text-[9px]">Detalhes</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 ml-auto">
            <Calendar className="w-3 h-3" />
            <span className="text-[9px]">{dueDateLabel ?? 'Sem prazo'}</span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CardModal
          card={card}
          onClose={() => setIsModalOpen(false)}
          onRefresh={onUpdate}
        />
      )}
    </>
  );
};

export default Card;
