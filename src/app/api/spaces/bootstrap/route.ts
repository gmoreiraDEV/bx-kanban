import { NextResponse } from 'next/server';

import { bootstrapDefaultSpace } from '@/lib/server/spaces';
import { stackServerApp } from '@/stack/server';

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

  const spaces = await bootstrapDefaultSpace({
    userId: stackUser.id,
    userEmail: stackUser.primaryEmail,
    userName: stackUser.displayName ?? undefined,
  });

  return NextResponse.json({ data: spaces });
};
