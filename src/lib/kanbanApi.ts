import { Board, Card, CardComment, Column } from '@/types';
import { apiFetch } from '@/lib/apiClient';

export const kanbanApi = {
  getBoards: (tenantId: string) =>
    apiFetch<Board[]>(`/api/kanban/boards?tenantId=${tenantId}`),
  createBoard: (data: { tenantId: string; title: string }) =>
    apiFetch<Board>('/api/kanban/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateBoard: (id: string, data: { tenantId: string; title: string }) =>
    apiFetch<Board>(`/api/kanban/boards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteBoard: (id: string, tenantId: string) =>
    apiFetch<null>(`/api/kanban/boards/${id}?tenantId=${tenantId}`, {
      method: 'DELETE',
    }),
  getColumns: (boardId: string) =>
    apiFetch<Column[]>(`/api/kanban/columns?boardId=${boardId}`),
  createColumn: (data: { tenantId: string; boardId: string; title: string; position: number }) =>
    apiFetch<Column>('/api/kanban/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteColumn: (id: string) =>
    apiFetch<null>(`/api/kanban/columns?id=${id}`, {
      method: 'DELETE',
    }),
  getCards: (columnId: string) =>
    apiFetch<Card[]>(`/api/kanban/cards?columnId=${columnId}`),
  createCard: (data: {
    tenantId: string;
    boardId: string;
    columnId: string;
    title: string;
    description?: string;
    assignedUserId?: string | null;
    dueDate?: string | null;
    position: number;
  }) =>
    apiFetch<Card>('/api/kanban/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateCard: (data: {
    id: string;
    title?: string;
    description?: string;
    assignedUserId?: string | null;
    dueDate?: string | null;
    columnId?: string;
    position?: number;
  }) =>
    apiFetch<Card>('/api/kanban/cards', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteCard: (id: string) =>
    apiFetch<null>(`/api/kanban/cards?id=${id}`, {
      method: 'DELETE',
    }),
  getCardComments: (cardId: string, tenantId: string) =>
    apiFetch<CardComment[]>(`/api/kanban/cards/${cardId}/comments?tenantId=${tenantId}`),
  createCardComment: (
    cardId: string,
    data: {
      tenantId: string;
      authorUserId: string;
      authorName: string;
      content: string;
    }
  ) =>
    apiFetch<CardComment>(`/api/kanban/cards/${cardId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};

export const bootstrapKanban = async (tenantId: string) => {
  const boards = await kanbanApi.getBoards(tenantId);
  if (boards.length > 0) {
    return boards[0];
  }

  const board = await kanbanApi.createBoard({ tenantId, title: 'Meu Kanban' });
  const todo = await kanbanApi.createColumn({
    tenantId,
    boardId: board.id,
    title: 'To Do',
    position: 0,
  });
  const inProgress = await kanbanApi.createColumn({
    tenantId,
    boardId: board.id,
    title: 'In Progress',
    position: 1,
  });
  await kanbanApi.createColumn({
    tenantId,
    boardId: board.id,
    title: 'Done',
    position: 2,
  });

  await kanbanApi.createCard({
    tenantId,
    boardId: board.id,
    columnId: todo.id,
    title: 'Bem-vindo ao Kanban',
    description: 'Arraste este card para as outras colunas para testar.',
    position: 0,
  });

  return board;
};
