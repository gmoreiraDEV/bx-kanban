import { NextResponse } from 'next/server';

import { getApiStore, withTimestamps } from '@/lib/apiStore';
import { Column } from '@/types';

export const GET = (request: Request) => {
  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get('boardId');
  const store = getApiStore();

  const columns = boardId ? store.columns.filter(column => column.boardId === boardId) : store.columns;

  return NextResponse.json({ data: columns });
};

export const POST = async (request: Request) => {
  const body = await request.json();
  const tenantId = body?.tenantId as string | undefined;
  const boardId = body?.boardId as string | undefined;
  const title = body?.title as string | undefined;
  const position = Number(body?.position ?? 0);

  if (!tenantId || !boardId || !title) {
    return NextResponse.json({ error: 'tenantId, boardId, and title are required.' }, { status: 400 });
  }

  const store = getApiStore();
  const column: Column = {
    id: crypto.randomUUID(),
    tenantId,
    boardId,
    title,
    position,
    ...withTimestamps(),
  };

  store.columns.push(column);

  return NextResponse.json({ data: column }, { status: 201 });
};

export const DELETE = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const body = request.headers.get('content-type')?.includes('application/json')
    ? await request.json()
    : null;
  const id = searchParams.get('id') ?? (body?.id as string | undefined);

  if (!id) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 });
  }

  const store = getApiStore();
  store.columns = store.columns.filter(column => column.id !== id);
  store.cards = store.cards.filter(card => card.columnId !== id);

  return NextResponse.json({ data: null }, { status: 200 });
};
