import { NextResponse } from 'next/server';

import { bootstrapDefaultSpace } from '@/lib/server/spaces';

export const POST = async (request: Request) => {
  const body = await request.json();
  const userId = body?.userId as string | undefined;
  const userEmail = body?.userEmail as string | undefined;
  const userName = body?.userName as string | undefined;

  if (!userId || !userEmail) {
    return NextResponse.json({ error: 'userId and userEmail are required.' }, { status: 400 });
  }

  const spaces = await bootstrapDefaultSpace({ userId, userEmail, userName });
  return NextResponse.json({ data: spaces });
};
