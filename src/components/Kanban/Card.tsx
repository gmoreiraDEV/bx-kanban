'use client'


import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card as CardType } from '@/types';
import { kanbanApi } from '@/lib/kanbanApi';
import { MoreHorizontal, Calendar, AlignLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardProps {
  card: CardType;
  onUpdate: () => void;
}

const Card: React.FC<CardProps> = ({ card, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(card.title);

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

  const handleSave = async () => {
    await kanbanApi.updateCard({ id: card.id, title });
    setIsEditing(false);
    onUpdate();
  };

  if (isEditing) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-500 space-y-2">
        <textarea
          autoFocus
          className="w-full text-sm border-none focus:ring-0 resize-none p-0 outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setIsEditing(false);
          }}
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => setIsEditing(false)} className="text-[10px] text-slate-500 hover:text-slate-800">Cancelar</button>
          <button onClick={handleSave} className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px]">Salvar</button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (e.detail === 2) setIsEditing(true); // Double click to edit
      }}
      className={cn(
        "bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 hover:border-blue-400 transition-all cursor-grab active:cursor-grabbing group select-none",
        isDragging && "opacity-30 border-blue-600 border-2"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-slate-800 leading-tight">{card.title}</p>
        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400">
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
          <AlignLeft className="w-3 h-3" />
          <span className="text-[9px]">DOC</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 ml-auto">
          <Calendar className="w-3 h-3" />
          <span className="text-[9px]">Hoje</span>
        </div>
      </div>
    </div>
  );
};

export default Card;
