import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import { tenantMembers, tenants } from '@/db/schema';
import { mapSpaceMember } from '@/lib/server/mappers';
import { normalizeEmail } from '@/lib/server/identity';
import { sendSpaceInviteEmail } from '@/lib/server/email';
import { inviteMemberToSpace, updateSpaceMemberName } from '@/lib/server/spaces';
import { stackServerApp } from '@/stack/server';

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
  const stackUser = await stackServerApp.getUser({ tokenStore: request });
  if (!stackUser) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body = await request.json();
  const email = body?.email as string | undefined;
  const name = body?.name as string | undefined;
  const role = body?.role as 'owner' | 'admin' | 'member' | undefined;
  const inviterName = stackUser.displayName ?? (body?.inviterName as string | undefined);
  const inviterEmail = stackUser.primaryEmail ?? (body?.inviterEmail as string | undefined);

  if (!email) {
    return NextResponse.json({ error: 'email is required.' }, { status: 400 });
  }

  const space = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.id, spaceId))
    .limit(1);

  if (space.length === 0) {
    return NextResponse.json({ error: 'Space not found.' }, { status: 404 });
  }

  try {
    const appUrl =
      process.env.APP_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      new URL(request.url).origin;

    await sendSpaceInviteEmail({
      to: normalizeEmail(email),
      spaceName: space[0].name,
      inviterName: inviterName?.trim(),
      inviterEmail: inviterEmail?.trim(),
      appUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? `Não foi possível enviar o convite por e-mail: ${error.message}`
        : 'Não foi possível enviar o convite por e-mail.';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const members = await inviteMemberToSpace({ spaceId, email, name, role });
  return NextResponse.json({ data: members.map(mapSpaceMember) });
};

export const PATCH = async (request: Request, context: RouteContext) => {
  const { spaceId } = await context.params;
  const body = await request.json();
  const userId = body?.userId as string | undefined;
  const name = body?.name as string | undefined;

  if (!userId || !name?.trim()) {
    return NextResponse.json({ error: 'userId and name are required.' }, { status: 400 });
  }

  const members = await updateSpaceMemberName({ spaceId, userId, name: name.trim() });
  if (!members) {
    return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
  }

  return NextResponse.json({ data: members.map(mapSpaceMember) });
};
