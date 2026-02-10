import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { pages, tenants } from '@/db/schema';
import { mapPage } from '@/lib/server/mappers';

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required.' }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(pages)
    .where(eq(pages.tenantId, tenantId))
    .orderBy(desc(pages.updatedAt));

  return NextResponse.json({ data: rows.map(mapPage) });
};

export const POST = async (request: Request) => {
  const body = await request.json();
  const tenantId = body?.tenantId as string | undefined;
  const title = body?.title as string | undefined;
  const content = body?.content as string | undefined;
  const boardId = (body?.boardId as string | undefined) ?? null;
  const cardId = (body?.cardId as string | undefined) ?? null;

  if (!tenantId || !title || !content) {
    return NextResponse.json({ error: 'tenantId, title, and content are required.' }, { status: 400 });
  }

  const tenant = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (tenant.length === 0) {
    return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
  }

  const [created] = await db
    .insert(pages)
    .values({
      id: crypto.randomUUID(),
      tenantId,
      title,
      content,
      boardId,
      cardId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ data: mapPage(created) }, { status: 201 });
};
