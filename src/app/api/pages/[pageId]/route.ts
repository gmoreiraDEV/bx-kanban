import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { pages, pageVersions } from '@/db/schema';
import { mapPage, mapPageVersion } from '@/lib/server/mappers';

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

  const versions = await db
    .select()
    .from(pageVersions)
    .where(and(eq(pageVersions.pageId, pageId), eq(pageVersions.tenantId, tenantId)))
    .orderBy(desc(pageVersions.createdAt))
    .limit(20);

  return NextResponse.json({
    data: mapPage(page[0]),
    versions: versions.map(mapPageVersion),
  });
};

export const PATCH = async (request: Request, context: RouteContext) => {
  const { pageId } = await context.params;
  const body = await request.json();
  const tenantId = body?.tenantId as string | undefined;
  const title = body?.title as string | undefined;
  const content = body?.content as string | undefined;
  const editorStateJson = body?.editorStateJson as string | undefined;
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

  const previous = existing[0];

  const [updated] = await db
    .update(pages)
    .set({
      title: title ?? previous.title,
      content: content ?? previous.content,
      editorStateJson: editorStateJson ?? previous.editorStateJson,
      boardId: boardId === undefined ? previous.boardId : boardId,
      cardId: cardId === undefined ? previous.cardId : cardId,
      updatedAt: new Date(),
    })
    .where(and(eq(pages.id, pageId), eq(pages.tenantId, tenantId)))
    .returning();

  const contentChanged = content !== undefined && content !== previous.content;
  const editorStateChanged =
    editorStateJson !== undefined && editorStateJson !== previous.editorStateJson;

  if (contentChanged || editorStateChanged) {
    await db.insert(pageVersions).values({
      id: crypto.randomUUID(),
      pageId,
      tenantId,
      content: previous.content,
      editorStateJson: previous.editorStateJson,
      createdAt: new Date(),
    });
  }

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
