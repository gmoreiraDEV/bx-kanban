import { and, asc, eq, inArray, ne } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { boards, cardDocumentLinks, cards, columns, pages } from '@/db/schema';
import { mapCard } from '@/lib/server/mappers';

const dueDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDueDate = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!dueDatePattern.test(trimmed)) return null;
  return trimmed;
};


const loadCardsWithDocumentLinks = async (rows: (typeof cards.$inferSelect)[]) => {
  if (rows.length === 0) return [];

  const links = await db
    .select({
      cardId: cardDocumentLinks.cardId,
      pageId: pages.id,
      pageTitle: pages.title,
    })
    .from(cardDocumentLinks)
    .innerJoin(pages, eq(pages.id, cardDocumentLinks.pageId))
    .where(inArray(cardDocumentLinks.cardId, rows.map(row => row.id)));

  const linksByCard = new Map<string, { pageId: string; pageTitle: string }[]>();
  for (const link of links) {
    const current = linksByCard.get(link.cardId) ?? [];
    current.push({ pageId: link.pageId, pageTitle: link.pageTitle });
    linksByCard.set(link.cardId, current);
  }

  return rows.map(row => ({
    ...mapCard(row),
    documentLinks: linksByCard.get(row.id) ?? [],
  }));
};

const replaceCardDocumentLinks = async (
  tx: any,
  cardId: string,
  tenantId: string,
  links: unknown
) => {
  if (!Array.isArray(links)) return;

  const normalized = links
    .map(item => ({
      pageId: typeof item?.pageId === 'string' ? item.pageId.trim() : '',
    }))
    .filter(item => item.pageId.length > 0);

  const uniquePageIds = [...new Set(normalized.map(item => item.pageId))];

  const validPages = uniquePageIds.length
    ? await tx
        .select({ id: pages.id })
        .from(pages)
        .where(and(eq(pages.tenantId, tenantId), inArray(pages.id, uniquePageIds)))
    : [];

  const validIds = new Set(validPages.map(page => page.id));

  await tx.delete(cardDocumentLinks).where(eq(cardDocumentLinks.cardId, cardId));

  if (validIds.size > 0) {
    await tx.insert(cardDocumentLinks).values(
      [...validIds].map(pageId => ({
        cardId,
        pageId,
        tenantId,
        createdAt: new Date(),
      }))
    );
  }
};

const reorderColumn = async (
  tx: any,
  columnId: string,
  movingCardId: string | null,
  requestedPosition: number | null
) => {
  const current = movingCardId
    ? await tx
        .select({ id: cards.id })
        .from(cards)
        .where(and(eq(cards.columnId, columnId), ne(cards.id, movingCardId)))
        .orderBy(asc(cards.position))
    : await tx
        .select({ id: cards.id })
        .from(cards)
        .where(eq(cards.columnId, columnId))
        .orderBy(asc(cards.position));

  const orderedIds = current.map(card => card.id);

  if (movingCardId) {
    const nextIndex =
      requestedPosition === null
        ? orderedIds.length
        : Math.max(0, Math.min(requestedPosition, orderedIds.length));
    orderedIds.splice(nextIndex, 0, movingCardId);
  }

  for (const [index, id] of orderedIds.entries()) {
    await tx
      .update(cards)
      .set({ position: index, updatedAt: new Date() })
      .where(eq(cards.id, id));
  }
};

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const columnId = searchParams.get('columnId');

  if (!columnId) {
    return NextResponse.json({ error: 'columnId is required.' }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(cards)
    .where(eq(cards.columnId, columnId))
    .orderBy(asc(cards.position));

  return NextResponse.json({ data: await loadCardsWithDocumentLinks(rows) });
};

export const POST = async (request: Request) => {
  const body = await request.json();
  const tenantId = body?.tenantId as string | undefined;
  const boardId = body?.boardId as string | undefined;
  const columnId = body?.columnId as string | undefined;
  const title = body?.title as string | undefined;
  const description = (body?.description as string | undefined) ?? '';
  const assignedUserId = (body?.assignedUserId as string | null | undefined) ?? null;
  const dueDate = normalizeDueDate(body?.dueDate);
  const position = Number(body?.position ?? 0);

  if (!tenantId || !boardId || !columnId || !title) {
    return NextResponse.json({ error: 'tenantId, boardId, columnId, and title are required.' }, { status: 400 });
  }

  const [board, column] = await Promise.all([
    db
      .select({ id: boards.id })
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.tenantId, tenantId)))
      .limit(1),
    db
      .select({ id: columns.id })
      .from(columns)
      .where(and(eq(columns.id, columnId), eq(columns.boardId, boardId), eq(columns.tenantId, tenantId)))
      .limit(1),
  ]);

  if (board.length === 0 || column.length === 0) {
    return NextResponse.json({ error: 'Board or column not found.' }, { status: 404 });
  }

  const [created] = await db
    .insert(cards)
    .values({
      id: crypto.randomUUID(),
      tenantId,
      boardId,
      columnId,
      title,
      description,
      assignedUserId,
      dueDate: dueDate ?? null,
      position: Number.isFinite(position) ? position : 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  await db.transaction(async tx => {
    await reorderColumn(tx, columnId, created.id, Number.isFinite(position) ? position : 0);
  });

  if (body?.documentLinks !== undefined) {
    await db.transaction(async tx => {
      await replaceCardDocumentLinks(tx, created.id, tenantId, body.documentLinks);
    });
  }

  const [saved] = await db.select().from(cards).where(eq(cards.id, created.id)).limit(1);
  const [withLinks] = await loadCardsWithDocumentLinks([saved]);

  return NextResponse.json({ data: withLinks }, { status: 201 });
};

export const PATCH = async (request: Request) => {
  const body = await request.json();
  const id = body?.id as string | undefined;

  if (!id) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 });
  }

  const existing = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Card not found.' }, { status: 404 });
  }

  const current = existing[0];
  const nextColumnId = (body?.columnId as string | undefined) ?? current.columnId;
  const hasPosition = typeof body?.position === 'number';
  const requestedPosition = hasPosition
    ? (body.position as number)
    : nextColumnId === current.columnId
      ? current.position
      : null;

  await db.transaction(async tx => {
    await tx
      .update(cards)
      .set({
        title: (body?.title as string | undefined) ?? current.title,
        description: (body?.description as string | undefined) ?? current.description,
        assignedUserId:
          body?.assignedUserId === undefined
            ? current.assignedUserId
            : ((body.assignedUserId as string | null | undefined) ?? null),
        dueDate:
          body?.dueDate === undefined
            ? current.dueDate
            : (normalizeDueDate(body?.dueDate) ?? null),
        columnId: nextColumnId,
        position: current.position,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, id));

    if (body?.documentLinks !== undefined) {
      await replaceCardDocumentLinks(tx, id, current.tenantId, body.documentLinks);
    }

    const shouldReorder = current.columnId !== nextColumnId || hasPosition;
    if (shouldReorder) {
      await reorderColumn(
        tx,
        nextColumnId,
        id,
        requestedPosition === null ? null : Number.isFinite(requestedPosition) ? requestedPosition : 0
      );

      if (current.columnId !== nextColumnId) {
        await reorderColumn(tx, current.columnId, null, null);
      }
    }
  });

  const [updated] = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
  const [withLinks] = await loadCardsWithDocumentLinks([updated]);
  return NextResponse.json({ data: withLinks });
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

  const existing = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Card not found.' }, { status: 404 });
  }

  const current = existing[0];

  await db.transaction(async tx => {
    await tx.delete(cards).where(eq(cards.id, id));
    await reorderColumn(tx, current.columnId, null, null);
  });

  return NextResponse.json({ data: null }, { status: 200 });
};
