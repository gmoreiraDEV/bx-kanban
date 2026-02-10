import { and, asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { boards, columns } from '@/db/schema';
import { mapColumn } from '@/lib/server/mappers';

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get('boardId');

  if (!boardId) {
    return NextResponse.json({ error: 'boardId is required.' }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(columns)
    .where(eq(columns.boardId, boardId))
    .orderBy(asc(columns.position));

  return NextResponse.json({ data: rows.map(mapColumn) });
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

  const board = await db
    .select({ id: boards.id })
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.tenantId, tenantId)))
    .limit(1);

  if (board.length === 0) {
    return NextResponse.json({ error: 'Board not found.' }, { status: 404 });
  }

  const [created] = await db
    .insert(columns)
    .values({
      id: crypto.randomUUID(),
      tenantId,
      boardId,
      title,
      position: Number.isFinite(position) ? position : 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ data: mapColumn(created) }, { status: 201 });
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

  await db.delete(columns).where(eq(columns.id, id));

  return NextResponse.json({ data: null }, { status: 200 });
};
