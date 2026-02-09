import { NextResponse } from 'next/server';

import { getApiStore, withTimestamps } from '@/lib/apiStore';
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
