'use client'


import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { db } from '@/db';
import { stackAuth } from '@/lib/stack-auth';
import { Column as ColumnType, Card as CardType } from '@/types';
import Column from './Column';
import { Plus, Settings2, MoreHorizontal } from 'lucide-react';

interface BoardProps {
  boardId: string;
}

const Board: React.FC<BoardProps> = ({ boardId }) => {
  const currentSpace = stackAuth.useCurrentSpace();
  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadData = () => {
    if (!currentSpace) return;
    const cols = db.getColumns(boardId);
    setColumns(cols);
    const allCards: CardType[] = [];
    cols.forEach(col => {
      allCards.push(...db.getCards(col.id));
    });
    setCards(allCards);
  };

  useEffect(() => {
    loadData();
  }, [boardId]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = cards.find(c => c.id === active.id);
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCard = cards.find(c => c.id === activeId);
    if (!activeCard) return;

    // Check if dropping over a column or another card
    const overIsColumn = columns.some(c => c.id === overId);
    const overCard = cards.find(c => c.id === overId);
    
    const targetColumnId = overIsColumn ? overId : (overCard?.columnId);

    if (targetColumnId && activeCard.columnId !== targetColumnId) {
      setCards(prev => {
        const newCards = [...prev];
        const cardIndex = newCards.findIndex(c => c.id === activeId);
        if (cardIndex !== -1) {
          newCards[cardIndex] = { ...newCards[cardIndex], columnId: targetColumnId };
        }
        return newCards;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveCard(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const overIsColumn = columns.some(c => c.id === overId);
    const overCard = cards.find(c => c.id === overId);
    const targetColumnId = overIsColumn ? overId : overCard?.columnId;

    if (targetColumnId) {
      const activeCard = cards.find(c => c.id === activeId);
      if (activeCard) {
        // Find index in final array
        const columnCards = cards.filter(c => c.columnId === targetColumnId);
        let newIndex = columnCards.length;
        if (!overIsColumn) {
          newIndex = columnCards.findIndex(c => c.id === overId);
        }
        
        db.moveCard(activeId, targetColumnId, newIndex);
        loadData();
      }
    }

    setActiveCard(null);
  };

  const addColumn = () => {
    const title = prompt('Nome da coluna:');
    if (title && currentSpace) {
      db.createColumn({
        tenantId: currentSpace.id,
        boardId,
        title,
        position: columns.length
      });
      loadData();
    }
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800">Board do Projeto</h1>
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-slate-50 transition-colors">
            <Settings2 className="w-4 h-4" /> Filtros
          </button>
          <button onClick={addColumn} className="flex items-center gap-2 px-4 py-1.5 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Coluna
          </button>
        </div>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
            {columns.map(column => (
              <Column 
                key={column.id} 
                column={column} 
                cards={cards.filter(c => c.columnId === column.id)}
                onUpdate={loadData}
              />
            ))}
          </SortableContext>
          
          <button 
            onClick={addColumn}
            className="w-80 flex-shrink-0 h-16 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-all hover:bg-slate-100/50"
          >
            <Plus className="w-5 h-5" /> Adicionar Coluna
          </button>
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeCard ? (
            <div className="w-80 bg-white p-4 rounded-xl shadow-2xl border-2 border-blue-500 rotate-2">
              <p className="text-sm font-semibold text-slate-800">{activeCard.title}</p>
              {activeCard.description && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{activeCard.description}</p>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default Board;
