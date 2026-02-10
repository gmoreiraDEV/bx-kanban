import { Board, Card, Column, Page, PageInviteToken, Space, SpaceMember } from '@/types';
import { boards, cards, columns, pageInviteTokens, pages, tenantMembers, tenants } from '@/db/schema';

const toIsoString = (value: Date | string | null | undefined) => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

export const mapBoard = (row: typeof boards.$inferSelect): Board => ({
  id: row.id,
  tenantId: row.tenantId,
  title: row.title,
  lastAccessedAt: toIsoString(row.lastAccessedAt) ?? new Date().toISOString(),
  createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString(),
});

export const mapColumn = (row: typeof columns.$inferSelect): Column => ({
  id: row.id,
  tenantId: row.tenantId,
  boardId: row.boardId,
  title: row.title,
  position: row.position,
  createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString(),
});

export const mapCard = (row: typeof cards.$inferSelect): Card => ({
  id: row.id,
  tenantId: row.tenantId,
  boardId: row.boardId,
  columnId: row.columnId,
  title: row.title,
  description: row.description,
  position: row.position,
  createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString(),
});

export const mapPage = (row: typeof pages.$inferSelect): Page => ({
  id: row.id,
  tenantId: row.tenantId,
  title: row.title,
  content: row.content,
  boardId: row.boardId ?? undefined,
  cardId: row.cardId ?? undefined,
  createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString(),
});

export const mapPageInviteToken = (
  row: typeof pageInviteTokens.$inferSelect
): PageInviteToken => ({
  id: row.id,
  tenantId: row.tenantId,
  pageId: row.pageId,
  token: row.token,
  permission: row.permission as 'view' | 'edit',
  expiresAt: toIsoString(row.expiresAt) ?? new Date().toISOString(),
  createdByUserId: row.createdByUserId,
  createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  revokedAt: toIsoString(row.revokedAt),
  lastUsedAt: toIsoString(row.lastUsedAt),
});

export const mapSpaceMember = (row: typeof tenantMembers.$inferSelect): SpaceMember => ({
  userId: row.userId,
  email: row.email,
  role: row.role as 'owner' | 'admin' | 'member',
});

export const mapSpace = (
  tenant: typeof tenants.$inferSelect,
  members: (typeof tenantMembers.$inferSelect)[]
): Space => {
  const mappedMembers = members.map(mapSpaceMember);
  const owner = mappedMembers.find(member => member.role === 'owner');

  return {
    id: tenant.id,
    name: tenant.name,
    teamId: tenant.teamId,
    ownerId: owner?.userId ?? mappedMembers[0]?.userId ?? '',
    members: mappedMembers,
  };
};
