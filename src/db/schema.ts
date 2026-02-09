import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

const timestampWithTimezone = (name: string) =>
  timestamp(name, { withTimezone: true }).notNull().defaultNow();

export const tenants = pgTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  teamId: text('team_id').notNull(),
  createdAt: timestampWithTimezone('created_at'),
  updatedAt: timestampWithTimezone('updated_at'),
});

export const boards = pgTable('boards', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  lastAccessedAt: timestampWithTimezone('last_accessed_at'),
  createdAt: timestampWithTimezone('created_at'),
  updatedAt: timestampWithTimezone('updated_at'),
});

export const columns = pgTable('columns', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  boardId: text('board_id')
    .notNull()
    .references(() => boards.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  position: integer('position').notNull(),
  createdAt: timestampWithTimezone('created_at'),
  updatedAt: timestampWithTimezone('updated_at'),
});

export const cards = pgTable('cards', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  boardId: text('board_id')
    .notNull()
    .references(() => boards.id, { onDelete: 'cascade' }),
  columnId: text('column_id')
    .notNull()
    .references(() => columns.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  position: integer('position').notNull(),
  createdAt: timestampWithTimezone('created_at'),
  updatedAt: timestampWithTimezone('updated_at'),
});

export const pages = pgTable('pages', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  boardId: text('board_id').references(() => boards.id, { onDelete: 'set null' }),
  cardId: text('card_id').references(() => cards.id, { onDelete: 'set null' }),
  createdAt: timestampWithTimezone('created_at'),
  updatedAt: timestampWithTimezone('updated_at'),
});

export const pageInviteTokens = pgTable('page_invite_tokens', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  pageId: text('page_id')
    .notNull()
    .references(() => pages.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  permission: text('permission').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdByUserId: text('created_by_user_id').notNull(),
  createdAt: timestampWithTimezone('created_at'),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
});
