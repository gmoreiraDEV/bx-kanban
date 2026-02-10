import { Page, PageInviteToken } from '@/types';

import { apiFetch } from '@/lib/apiClient';

type SharedPagePayload = {
  invite: PageInviteToken;
  page: Page;
};

export const pagesApi = {
  getPages: (tenantId: string) => apiFetch<Page[]>(`/api/pages?tenantId=${tenantId}`),
  createPage: (data: {
    tenantId: string;
    title: string;
    content: string;
    boardId?: string;
    cardId?: string;
  }) =>
    apiFetch<Page>('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  getPage: (pageId: string, tenantId: string) =>
    apiFetch<Page>(`/api/pages/${pageId}?tenantId=${tenantId}`),
  updatePage: (
    pageId: string,
    data: {
      tenantId: string;
      title?: string;
      content?: string;
      boardId?: string | null;
      cardId?: string | null;
    }
  ) =>
    apiFetch<Page>(`/api/pages/${pageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deletePage: (pageId: string, tenantId: string) =>
    apiFetch<null>(`/api/pages/${pageId}?tenantId=${tenantId}`, {
      method: 'DELETE',
    }),
  getPageTokens: (pageId: string, tenantId: string) =>
    apiFetch<PageInviteToken[]>(`/api/pages/${pageId}/tokens?tenantId=${tenantId}`),
  createPageToken: (
    pageId: string,
    data: {
      tenantId: string;
      token: string;
      permission: 'view' | 'edit';
      expiresAt: string;
      createdByUserId: string;
    }
  ) =>
    apiFetch<PageInviteToken>(`/api/pages/${pageId}/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  revokePageToken: (tokenId: string) =>
    apiFetch<PageInviteToken>(`/api/page-tokens/${tokenId}/revoke`, {
      method: 'PATCH',
    }),
  getSharedPage: (token: string) =>
    apiFetch<SharedPagePayload>(`/api/share/page/${token}`),
  updateSharedPage: (token: string, data: { content?: string; title?: string }) =>
    apiFetch<SharedPagePayload>(`/api/share/page/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};
