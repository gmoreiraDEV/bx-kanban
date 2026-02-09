
import { Board, Column, Card, Page, PageInviteToken, Space } from '@/types';

const STORAGE_KEY = 'kanban_pages_pro_v1';

interface DBState {
  spaces: Space[];
  boards: Board[];
  columns: Column[];
  cards: Card[];
  pages: Page[];
  tokens: PageInviteToken[];
}

const defaultState: DBState = {
  spaces: [],
  boards: [],
  columns: [],
  cards: [],
  pages: [],
  tokens: []
};

function getDB(): DBState {
  if (typeof window === 'undefined') return defaultState;
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : defaultState;
}

function saveDB(state: DBState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const db = {
  // Common generic filter
  filterByTenant: <T extends { tenantId: string }>(items: T[], tenantId: string) => 
    items.filter(item => item.tenantId === tenantId),

  // Boards
  getBoards: (tenantId: string) => db.filterByTenant(getDB().boards, tenantId),
  getBoard: (id: string, tenantId: string) => getDB().boards.find(b => b.id === id && b.tenantId === tenantId),
  createBoard: (data: Omit<Board, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessedAt'>) => {
    const state = getDB();
    const newBoard: Board = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    };
    state.boards.push(newBoard);
    saveDB(state);
    return newBoard;
  },

  // Columns
  getColumns: (boardId: string) => getDB().columns.filter(c => c.boardId === boardId).sort((a, b) => a.position - b.position),
  createColumn: (data: Omit<Column, 'id' | 'createdAt' | 'updatedAt'>) => {
    const state = getDB();
    const newCol: Column = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.columns.push(newCol);
    saveDB(state);
    return newCol;
  },
  deleteColumn: (id: string) => {
    const state = getDB();
    state.columns = state.columns.filter(c => c.id !== id);
    state.cards = state.cards.filter(c => c.columnId !== id);
    saveDB(state);
  },

  // Cards
  getCards: (columnId: string) => getDB().cards.filter(c => c.columnId === columnId).sort((a, b) => a.position - b.position),
  createCard: (data: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => {
    const state = getDB();
    const newCard: Card = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.cards.push(newCard);
    saveDB(state);
    return newCard;
  },
  updateCard: (id: string, updates: Partial<Card>) => {
    const state = getDB();
    const index = state.cards.findIndex(c => c.id === id);
    if (index !== -1) {
      state.cards[index] = { ...state.cards[index], ...updates, updatedAt: new Date().toISOString() };
      saveDB(state);
    }
  },
  moveCard: (cardId: string, toColumnId: string, position: number) => {
    const state = getDB();
    const card = state.cards.find(c => c.id === cardId);
    if (!card) return;
    
    // Shift others in the target column
    const otherCards = state.cards.filter(c => c.columnId === toColumnId && c.id !== cardId).sort((a,b) => a.position - b.position);
    otherCards.splice(position, 0, card);
    
    otherCards.forEach((c, i) => {
      c.position = i;
      c.columnId = toColumnId;
    });
    
    saveDB(state);
  },

  // Pages
  getPages: (tenantId: string) => db.filterByTenant(getDB().pages, tenantId),
  getPage: (id: string, tenantId: string) => getDB().pages.find(p => p.id === id && p.tenantId === tenantId),
  createPage: (data: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>) => {
    const state = getDB();
    const newPage: Page = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.pages.push(newPage);
    saveDB(state);
    return newPage;
  },
  updatePage: (id: string, tenantId: string, updates: Partial<Page>) => {
    const state = getDB();
    const index = state.pages.findIndex(p => p.id === id && p.tenantId === tenantId);
    if (index !== -1) {
      state.pages[index] = { ...state.pages[index], ...updates, updatedAt: new Date().toISOString() };
      saveDB(state);
      return state.pages[index];
    }
  },
  deletePage: (id: string, tenantId: string) => {
    const state = getDB();
    state.pages = state.pages.filter(p => !(p.id === id && p.tenantId === tenantId));
    saveDB(state);
  },

  // Tokens
  createToken: (data: Omit<PageInviteToken, 'id' | 'createdAt' | 'revokedAt' | 'lastUsedAt'>) => {
    const state = getDB();
    const newToken: PageInviteToken = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      revokedAt: null,
      lastUsedAt: null,
    };
    state.tokens.push(newToken);
    saveDB(state);
    return newToken;
  },
  getToken: (token: string) => {
    const state = getDB();
    const found = state.tokens.find(t => t.token === token);
    if (found && !found.revokedAt && new Date(found.expiresAt) > new Date()) {
      found.lastUsedAt = new Date().toISOString();
      saveDB(state);
      return found;
    }
    return null;
  },
  revokeToken: (id: string) => {
    const state = getDB();
    const index = state.tokens.findIndex(t => t.id === id);
    if (index !== -1) {
      state.tokens[index].revokedAt = new Date().toISOString();
      saveDB(state);
    }
  },
  getPageTokens: (pageId: string) => getDB().tokens.filter(t => t.pageId === pageId),

  // Seed / Init for new Spaces
  bootstrapSpace: (tenantId: string, userId: string) => {
    const boards = db.getBoards(tenantId);
    if (boards.length === 0) {
      const board = db.createBoard({ tenantId, title: 'Meu Kanban' });
      const todo = db.createColumn({ tenantId, boardId: board.id, title: 'To Do', position: 0 });
      const inProgress = db.createColumn({ tenantId, boardId: board.id, title: 'In Progress', position: 1 });
      const done = db.createColumn({ tenantId, boardId: board.id, title: 'Done', position: 2 });
      
      db.createCard({ 
        tenantId, 
        boardId: board.id, 
        columnId: todo.id, 
        title: 'Bem-vindo ao Kanban', 
        description: 'Arraste este card para as outras colunas para testar.',
        position: 0 
      });

      db.createPage({
        tenantId,
        title: 'Bem-vindo!',
        content: '# Olá Mundo\n\nEste é o seu novo sistema de Pages. Sinta-se à vontade para editar este conteúdo.'
      });
    }
  }
};
