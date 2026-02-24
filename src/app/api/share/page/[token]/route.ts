import { and, eq, gt, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { pageInviteTokens, pages } from '@/db/schema';
import { mapPage, mapPageInviteToken } from '@/lib/server/mappers';

interface RouteContext {
  params: Promise<{ token: string }>;
}

const getActiveInvite = async (token: string) =>
  db
    .select()
    .from(pageInviteTokens)
    .where(
      and(
        eq(pageInviteTokens.token, token),
        isNull(pageInviteTokens.revokedAt),
        gt(pageInviteTokens.expiresAt, new Date())
      )
    )
    .limit(1);

export const GET = async (_request: Request, context: RouteContext) => {
  const { token } = await context.params;
  const inviteRows = await getActiveInvite(token);

  if (inviteRows.length === 0) {
    return NextResponse.json({ error: 'Invite token not found or expired.' }, { status: 404 });
  }

  const invite = inviteRows[0];

  await db
    .update(pageInviteTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(pageInviteTokens.id, invite.id));

  const pageRows = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, invite.pageId), eq(pages.tenantId, invite.tenantId)))
    .limit(1);

  if (pageRows.length === 0) {
    return NextResponse.json({ error: 'Page not found.' }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      invite: mapPageInviteToken(invite),
      page: mapPage(pageRows[0]),
    },
  });
};

export const PATCH = async (request: Request, context: RouteContext) => {
  const { token } = await context.params;
  const inviteRows = await getActiveInvite(token);

  if (inviteRows.length === 0) {
    return NextResponse.json({ error: 'Invite token not found or expired.' }, { status: 404 });
  }

  const invite = inviteRows[0];
  if (invite.permission !== 'edit') {
    return NextResponse.json({ error: 'Token does not allow editing.' }, { status: 403 });
  }

  const body = await request.json();
  const content = body?.content as string | undefined;
  const title = body?.title as string | undefined;
  const editorStateJson = body?.editorStateJson as string | undefined;

  const existingPage = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, invite.pageId), eq(pages.tenantId, invite.tenantId)))
    .limit(1);

  if (existingPage.length === 0) {
    return NextResponse.json({ error: 'Page not found.' }, { status: 404 });
  }

  const [updatedPage] = await db
    .update(pages)
    .set({
      title: title ?? existingPage[0].title,
      content: content ?? existingPage[0].content,
      editorStateJson: editorStateJson ?? existingPage[0].editorStateJson,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, invite.pageId))
    .returning();

  await db
    .update(pageInviteTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(pageInviteTokens.id, invite.id));

  return NextResponse.json({
    data: {
      invite: mapPageInviteToken(invite),
      page: mapPage(updatedPage),
    },
  });
};
