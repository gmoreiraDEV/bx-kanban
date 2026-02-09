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
