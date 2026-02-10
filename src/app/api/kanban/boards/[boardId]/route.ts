import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { boards } from '@/db/schema';
import { mapBoard } from '@/lib/server/mappers';

interface RouteContext {
  params: Promise<{ boardId: string }>;
}

export const PATCH = async (request: Request, context: RouteContext) => {
  const { boardId } = await context.params;
  const body = await request.json();
  const tenantId = body?.tenantId as string | undefined;
  const title = (body?.title as string | undefined)?.trim();

  if (!tenantId || !title) {
    return NextResponse.json({ error: 'tenantId and title are required.' }, { status: 400 });
  }

  const existing = await db
    .select({ id: boards.id })
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.tenantId, tenantId)))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Board not found.' }, { status: 404 });
  }

  const [updated] = await db
    .update(boards)
    .set({
      title,
      updatedAt: new Date(),
    })
    .where(and(eq(boards.id, boardId), eq(boards.tenantId, tenantId)))
    .returning();

  return NextResponse.json({ data: mapBoard(updated) });
};

export const DELETE = async (request: Request, context: RouteContext) => {
  const { boardId } = await context.params;
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required.' }, { status: 400 });
  }

  const existing = await db
    .select({ id: boards.id })
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.tenantId, tenantId)))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Board not found.' }, { status: 404 });
  }

  await db.delete(boards).where(and(eq(boards.id, boardId), eq(boards.tenantId, tenantId)));
  return NextResponse.json({ data: null }, { status: 200 });
};
