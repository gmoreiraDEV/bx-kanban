import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { pageInviteTokens } from '@/db/schema';
import { mapPageInviteToken } from '@/lib/server/mappers';

interface RouteContext {
  params: Promise<{ tokenId: string }>;
}

export const PATCH = async (_request: Request, context: RouteContext) => {
  const { tokenId } = await context.params;

  const [updated] = await db
    .update(pageInviteTokens)
    .set({
      revokedAt: new Date(),
    })
    .where(eq(pageInviteTokens.id, tokenId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Token not found.' }, { status: 404 });
  }

  return NextResponse.json({ data: mapPageInviteToken(updated) });
};
