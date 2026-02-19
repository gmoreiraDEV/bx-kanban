import { NextResponse } from 'next/server';

import { createSpace, getSpacesForUserEmail } from '@/lib/server/spaces';
import { stackServerApp } from '@/stack/server';

export const GET = async (request: Request) => {
  const stackUser = await stackServerApp.getUser({ tokenStore: request });
  if (!stackUser) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  if (!stackUser.primaryEmail) {
    return NextResponse.json(
      { error: 'Authenticated user does not have a primary email.' },
      { status: 400 }
    );
  }

  const spaces = await getSpacesForUserEmail(stackUser.primaryEmail);
  return NextResponse.json({ data: spaces });
};

export const POST = async (request: Request) => {
  const stackUser = await stackServerApp.getUser({ tokenStore: request });
  if (!stackUser) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  if (!stackUser.primaryEmail) {
    return NextResponse.json(
      { error: 'Authenticated user does not have a primary email.' },
      { status: 400 }
    );
  }

  const body = await request.json();
  const name = body?.name as string | undefined;

  if (!name) {
    return NextResponse.json({ error: 'name is required.' }, { status: 400 });
  }

  const space = await createSpace({
    name,
    userId: stackUser.id,
    userEmail: stackUser.primaryEmail,
    userName: stackUser.displayName ?? undefined,
  });

  return NextResponse.json({ data: space }, { status: 201 });
};
