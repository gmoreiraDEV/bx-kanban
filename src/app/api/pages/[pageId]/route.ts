import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { pages } from '@/db/schema';
import { mapPage } from '@/lib/server/mappers';

interface RouteContext {
  params: Promise<{ pageId: string }>;
}

export const GET = async (request: Request, context: RouteContext) => {
  const { pageId } = await context.params;
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required.' }, { status: 400 });
  }

  const page = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.tenantId, tenantId)))
    .limit(1);

  if (page.length === 0) {
    return NextResponse.json({ error: 'Page not found.' }, { status: 404 });
  }

  return NextResponse.json({ data: mapPage(page[0]) });
};

export const PATCH = async (request: Request, context: RouteContext) => {
  const { pageId } = await context.params;
  const body = await request.json();
  const tenantId = body?.tenantId as string | undefined;
  const title = body?.title as string | undefined;
  const content = body?.content as string | undefined;
  const boardId = body?.boardId as string | null | undefined;
  const cardId = body?.cardId as string | null | undefined;

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required.' }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.tenantId, tenantId)))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Page not found.' }, { status: 404 });
  }

  const [updated] = await db
    .update(pages)
    .set({
      title: title ?? existing[0].title,
      content: content ?? existing[0].content,
      boardId: boardId === undefined ? existing[0].boardId : boardId,
      cardId: cardId === undefined ? existing[0].cardId : cardId,
      updatedAt: new Date(),
    })
    .where(and(eq(pages.id, pageId), eq(pages.tenantId, tenantId)))
    .returning();

  return NextResponse.json({ data: mapPage(updated) });
};

export const DELETE = async (request: Request, context: RouteContext) => {
  const { pageId } = await context.params;
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required.' }, { status: 400 });
  }

  await db.delete(pages).where(and(eq(pages.id, pageId), eq(pages.tenantId, tenantId)));
  return NextResponse.json({ data: null }, { status: 200 });
};
