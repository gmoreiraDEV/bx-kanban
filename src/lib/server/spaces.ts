import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { tenantMembers, tenants } from '@/db/schema';
import { Space } from '@/types';

import { normalizeEmail, userIdFromEmail } from './identity';
import { mapSpace } from './mappers';

type CreateSpaceInput = {
  name: string;
  userId: string;
  userEmail: string;
  teamId?: string;
};

const unique = <T>(items: T[]) => [...new Set(items)];

const buildSpaces = async (tenantIds: string[]) => {
  if (tenantIds.length === 0) return [] as Space[];

  const [tenantRows, memberRows] = await Promise.all([
    db.select().from(tenants).where(inArray(tenants.id, tenantIds)),
    db.select().from(tenantMembers).where(inArray(tenantMembers.tenantId, tenantIds)),
  ]);

  return tenantRows.map(tenant =>
    mapSpace(
      tenant,
      memberRows.filter(member => member.tenantId === tenant.id)
    )
  );
};

export const getSpacesForUserEmail = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);

  const memberships = await db
    .select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers)
    .where(eq(tenantMembers.email, normalizedEmail));

  const tenantIds = unique(memberships.map(row => row.tenantId));
  return buildSpaces(tenantIds);
};

export const createSpace = async (input: CreateSpaceInput) => {
  const normalizedEmail = normalizeEmail(input.userEmail);
  const spaceId = `space-${crypto.randomUUID().slice(0, 8)}`;
  const teamId = input.teamId ?? `team-${crypto.randomUUID().slice(0, 8)}`;
  const ownerUserId = input.userId || userIdFromEmail(normalizedEmail);

  await db.transaction(async tx => {
    await tx.insert(tenants).values({
      id: spaceId,
      name: input.name,
      teamId,
    });

    await tx.insert(tenantMembers).values({
      tenantId: spaceId,
      userId: ownerUserId,
      email: normalizedEmail,
      role: 'owner',
    });
  });

  const [tenantRow] = await db.select().from(tenants).where(eq(tenants.id, spaceId));
  const memberRows = await db.select().from(tenantMembers).where(eq(tenantMembers.tenantId, spaceId));

  return mapSpace(tenantRow, memberRows);
};

export const bootstrapDefaultSpace = async (input: {
  userId: string;
  userEmail: string;
  userName?: string;
}) => {
  const spaces = await getSpacesForUserEmail(input.userEmail);
  if (spaces.length > 0) return spaces;

  const defaultName = input.userName
    ? `${input.userName} Workspace`
    : 'Personal Workspace';

  await createSpace({
    name: defaultName,
    userId: input.userId,
    userEmail: input.userEmail,
  });

  return getSpacesForUserEmail(input.userEmail);
};

export const inviteMemberToSpace = async (input: {
  spaceId: string;
  email: string;
  role?: 'owner' | 'admin' | 'member';
}) => {
  const normalizedEmail = normalizeEmail(input.email);
  const userId = userIdFromEmail(normalizedEmail);
  const role = input.role ?? 'member';

  const existing = await db
    .select()
    .from(tenantMembers)
    .where(
      and(
        eq(tenantMembers.tenantId, input.spaceId),
        eq(tenantMembers.email, normalizedEmail)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(tenantMembers)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tenantMembers.tenantId, input.spaceId),
          eq(tenantMembers.email, normalizedEmail)
        )
      );
  } else {
    await db.insert(tenantMembers).values({
      tenantId: input.spaceId,
      userId,
      email: normalizedEmail,
      role,
    });
  }

  return db
    .select()
    .from(tenantMembers)
    .where(eq(tenantMembers.tenantId, input.spaceId));
};
