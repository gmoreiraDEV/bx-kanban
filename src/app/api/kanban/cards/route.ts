import { NextResponse } from 'next/server';

import { getApiStore, touchUpdatedAt, withTimestamps } from '@/lib/apiStore';
import { Card } from '@/types';

export const GET = (request: Request) => {
  const { searchParams } = new URL(request.url);
  const columnId = searchParams.get('columnId');
  const store = getApiStore();

  const cards = columnId ? store.cards.filter(card => card.columnId === columnId) : store.cards;

  return NextResponse.json({ data: cards });
};

export const POST = async (request: Request) => {
  const body = await request.json();
  const tenantId = body?.tenantId as string | undefined;
  const boardId = body?.boardId as string | undefined;
  const columnId = body?.columnId as string | undefined;
  const title = body?.title as string | undefined;
  const description = (body?.description as string | undefined) ?? '';
  const position = Number(body?.position ?? 0);

  if (!tenantId || !boardId || !columnId || !title) {
    return NextResponse.json({ error: 'tenantId, boardId, columnId, and title are required.' }, { status: 400 });
  }

  const store = getApiStore();
  const card: Card = {
    id: crypto.randomUUID(),
    tenantId,
    boardId,
    columnId,
    title,
    description,
    position,
    ...withTimestamps(),
  };

  store.cards.push(card);

  return NextResponse.json({ data: card }, { status: 201 });
};

const normalizePositions = (cards: Card[], columnId: string, movingCard: Card | null, position: number | null) => {
  const columnCards = cards
    .filter(card => card.columnId === columnId && card.id !== movingCard?.id)
    .sort((a, b) => a.position - b.position);

  if (movingCard) {
    const targetIndex = position === null ? columnCards.length : Math.max(0, Math.min(position, columnCards.length));
    columnCards.splice(targetIndex, 0, movingCard);
  }

  columnCards.forEach((card, index) => {
    card.position = index;
  });
};

export const PATCH = async (request: Request) => {
  const body = await request.json();
  const id = body?.id as string | undefined;

  if (!id) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 });
  }

  const store = getApiStore();
  const index = store.cards.findIndex(card => card.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Card not found.' }, { status: 404 });
  }

  const existing = store.cards[index];
  const nextColumnId = (body?.columnId as string | undefined) ?? existing.columnId;
  const hasPosition = typeof body?.position === 'number';
  const nextPosition = hasPosition
    ? (body.position as number)
    : nextColumnId === existing.columnId
      ? existing.position
      : null;

  const updated: Card = {
    ...existing,
    title: (body?.title as string | undefined) ?? existing.title,
    description: (body?.description as string | undefined) ?? existing.description,
    columnId: nextColumnId,
    position: nextPosition ?? existing.position,
    updatedAt: touchUpdatedAt(),
  };

  store.cards[index] = updated;

  if (existing.columnId !== nextColumnId || hasPosition) {
    normalizePositions(store.cards, nextColumnId, updated, nextPosition);

    if (existing.columnId !== nextColumnId) {
      normalizePositions(store.cards, existing.columnId, null, null);
    }
  }

  return NextResponse.json({ data: updated });
};
