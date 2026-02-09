import { Board, Card, Column } from '@/types';

type ApiStore = {
  boards: Board[];
  columns: Column[];
  cards: Card[];
};

declare global {
  // eslint-disable-next-line no-var
  var __KANBAN_API_STORE__: ApiStore | undefined;
}

const createEmptyStore = (): ApiStore => ({
  boards: [],
  columns: [],
  cards: [],
});

export const getApiStore = (): ApiStore => {
  if (!globalThis.__KANBAN_API_STORE__) {
    globalThis.__KANBAN_API_STORE__ = createEmptyStore();
  }

  return globalThis.__KANBAN_API_STORE__;
};

export const withTimestamps = () => {
  const now = new Date().toISOString();
  return { createdAt: now, updatedAt: now };
};

export const touchUpdatedAt = () => new Date().toISOString();
