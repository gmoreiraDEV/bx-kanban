import { NextResponse } from 'next/server';

import { createSpace, getSpacesForUserEmail } from '@/lib/server/spaces';

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'email is required.' }, { status: 400 });
  }

  const spaces = await getSpacesForUserEmail(email);
  return NextResponse.json({ data: spaces });
};

export const POST = async (request: Request) => {
  const body = await request.json();
  const name = body?.name as string | undefined;
  const userId = body?.userId as string | undefined;
  const userEmail = body?.userEmail as string | undefined;

  if (!name || !userEmail) {
    return NextResponse.json({ error: 'name and userEmail are required.' }, { status: 400 });
  }

  const space = await createSpace({
    name,
    userId: userId ?? '',
    userEmail,
  });

  return NextResponse.json({ data: space }, { status: 201 });
};
