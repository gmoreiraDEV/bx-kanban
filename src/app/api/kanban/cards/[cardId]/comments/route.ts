import { and, asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { cardComments, cards } from '@/db/schema';
import { mapCardComment } from '@/lib/server/mappers';

interface RouteContext {
  params: Promise<{ cardId: string }>;
}

export const GET = async (request: Request, context: RouteContext) => {
  const { cardId } = await context.params;
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required.' }, { status: 400 });
  }

  const card = await db
    .select({ id: cards.id })
    .from(cards)
    .where(and(eq(cards.id, cardId), eq(cards.tenantId, tenantId)))
    .limit(1);

  if (card.length === 0) {
    return NextResponse.json({ error: 'Card not found.' }, { status: 404 });
  }

  const comments = await db
    .select()
    .from(cardComments)
    .where(and(eq(cardComments.cardId, cardId), eq(cardComments.tenantId, tenantId)))
    .orderBy(asc(cardComments.createdAt));

  return NextResponse.json({ data: comments.map(mapCardComment) });
};

export const POST = async (request: Request, context: RouteContext) => {
  const { cardId } = await context.params;
  const body = await request.json();
  const tenantId = body?.tenantId as string | undefined;
  const authorUserId = body?.authorUserId as string | undefined;
  const authorName = body?.authorName as string | undefined;
  const content = (body?.content as string | undefined)?.trim();

  if (!tenantId || !authorUserId || !authorName || !content) {
    return NextResponse.json(
      { error: 'tenantId, authorUserId, authorName, and content are required.' },
      { status: 400 }
    );
  }

  const card = await db
    .select({ id: cards.id })
    .from(cards)
    .where(and(eq(cards.id, cardId), eq(cards.tenantId, tenantId)))
    .limit(1);

  if (card.length === 0) {
    return NextResponse.json({ error: 'Card not found.' }, { status: 404 });
  }

  const [created] = await db
    .insert(cardComments)
    .values({
      id: crypto.randomUUID(),
      tenantId,
      cardId,
      authorUserId,
      authorName,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ data: mapCardComment(created) }, { status: 201 });
};
