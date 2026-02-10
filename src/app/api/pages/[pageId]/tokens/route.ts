import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { pageInviteTokens, pages } from '@/db/schema';
import { mapPageInviteToken } from '@/lib/server/mappers';

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

  const rows = await db
    .select()
    .from(pageInviteTokens)
    .where(and(eq(pageInviteTokens.pageId, pageId), eq(pageInviteTokens.tenantId, tenantId)))
    .orderBy(desc(pageInviteTokens.createdAt));

  return NextResponse.json({ data: rows.map(mapPageInviteToken) });
};

export const POST = async (request: Request, context: RouteContext) => {
  const { pageId } = await context.params;
  const body = await request.json();
  const tenantId = body?.tenantId as string | undefined;
  const token = body?.token as string | undefined;
  const permission = body?.permission as 'view' | 'edit' | undefined;
  const expiresAt = body?.expiresAt as string | undefined;
  const createdByUserId = body?.createdByUserId as string | undefined;

  if (!tenantId || !token || !permission || !expiresAt || !createdByUserId) {
    return NextResponse.json(
      { error: 'tenantId, token, permission, expiresAt, and createdByUserId are required.' },
      { status: 400 }
    );
  }

  const page = await db
    .select({ id: pages.id })
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.tenantId, tenantId)))
    .limit(1);

  if (page.length === 0) {
    return NextResponse.json({ error: 'Page not found.' }, { status: 404 });
  }

  const [created] = await db
    .insert(pageInviteTokens)
    .values({
      id: crypto.randomUUID(),
      tenantId,
      pageId,
      token,
      permission,
      expiresAt: new Date(expiresAt),
      createdByUserId,
      createdAt: new Date(),
      revokedAt: null,
      lastUsedAt: null,
    })
    .returning();

  return NextResponse.json({ data: mapPageInviteToken(created) }, { status: 201 });
};
