import { NextResponse } from 'next/server';

import { getApiStore, withTimestamps } from '@/lib/apiStore';
import { Board } from '@/types';

export const GET = (request: Request) => {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');
  const store = getApiStore();

  const boards = tenantId ? store.boards.filter(board => board.tenantId === tenantId) : store.boards;

  return NextResponse.json({ data: boards });
};

export const POST = async (request: Request) => {
  const body = await request.json();
  const tenantId = body?.tenantId as string | undefined;
  const title = body?.title as string | undefined;

  if (!tenantId || !title) {
    return NextResponse.json({ error: 'tenantId and title are required.' }, { status: 400 });
  }

  const store = getApiStore();
  const board: Board = {
    id: crypto.randomUUID(),
    tenantId,
    title,
    lastAccessedAt: new Date().toISOString(),
    ...withTimestamps(),
  };

  store.boards.push(board);

  return NextResponse.json({ data: board }, { status: 201 });
};
