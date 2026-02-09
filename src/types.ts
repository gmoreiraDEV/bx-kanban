
export type Permission = 'view' | 'edit';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Space {
  id: string;
  name: string;
  teamId: string;
  ownerId: string;
  members: SpaceMember[];
}

export interface SpaceMember {
  userId: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
}

export interface Board {
  id: string;
  tenantId: string;
  title: string;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  tenantId: string;
  boardId: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  tenantId: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  boardId?: string;
  cardId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageInviteToken {
  id: string;
  tenantId: string;
  pageId: string;
  token: string;
  permission: Permission;
  expiresAt: string;
  createdByUserId: string;
  createdAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
}
