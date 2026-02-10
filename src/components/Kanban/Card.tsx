'use client'

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare, MoreHorizontal } from 'lucide-react';

import { Card as CardType } from '@/types';
import { cn } from '@/lib/utils';

import CardModal from './CardModal';

interface CardProps {
  card: CardType;
  onUpdate: () => void;
}

const Card: React.FC<CardProps> = ({ card, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

        <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-1 text-slate-400">
            <MessageSquare className="w-3 h-3" />
            <span className="text-[9px]">Detalhes</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 ml-auto">
            <Calendar className="w-3 h-3" />
            <span className="text-[9px]">Hoje</span>
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
