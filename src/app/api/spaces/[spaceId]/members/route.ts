import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { tenantMembers } from '@/db/schema';
import { mapSpaceMember } from '@/lib/server/mappers';
import { inviteMemberToSpace } from '@/lib/server/spaces';

interface RouteContext {
  params: Promise<{ spaceId: string }>;
}

export const GET = async (_request: Request, context: RouteContext) => {
  const { spaceId } = await context.params;
  const members = await db
    .select()
    .from(tenantMembers)
    .where(eq(tenantMembers.tenantId, spaceId));

  return NextResponse.json({ data: members.map(mapSpaceMember) });
};

export const POST = async (request: Request, context: RouteContext) => {
  const { spaceId } = await context.params;
  const body = await request.json();
  const email = body?.email as string | undefined;
  const role = body?.role as 'owner' | 'admin' | 'member' | undefined;

  if (!email) {
    return NextResponse.json({ error: 'email is required.' }, { status: 400 });
  }

  const members = await inviteMemberToSpace({ spaceId, email, role });
  return NextResponse.json({ data: members.map(mapSpaceMember) });
};
