
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { db } from '../services/db';
import { stackAuth } from '../services/stack-auth';
import KanbanBoard from '../components/Kanban/Board';

const BoardsPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const currentSpace = stackAuth.useCurrentSpace();
  
  if (!currentSpace) return null;

  const boards = db.getBoards(currentSpace.id);

  if (!boardId && boards.length > 0) {
    return <Navigate to={`/app/boards/${boards[0].id}`} replace />;
  }

  if (boardId) {
    const board = db.getBoard(boardId, currentSpace.id);
    if (!board) return <div className="p-10 text-center text-slate-500">Board não encontrado ou você não tem acesso.</div>;
    return <KanbanBoard boardId={boardId} />;
  }

  return (
    <div className="p-20 text-center flex flex-col items-center justify-center h-full">
      <div className="bg-blue-100 p-4 rounded-full mb-4">
        <div className="w-12 h-12 bg-blue-600 rounded-xl"></div>
      </div>
      <h2 className="text-2xl font-bold text-slate-800">Crie seu primeiro board</h2>
      <p className="text-slate-500 mt-2 max-w-sm">Organize suas tarefas visualmente com o Kanban. Comece criando um novo board agora.</p>
      <button 
        onClick={() => {
          const title = prompt('Nome do board:');
          if (title) db.createBoard({ tenantId: currentSpace.id, title });
          window.location.reload();
        }}
        className="mt-6 bg-blue-600 text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-blue-200"
      >
        Novo Board
      </button>
    </div>
  );
};

export default BoardsPage;
