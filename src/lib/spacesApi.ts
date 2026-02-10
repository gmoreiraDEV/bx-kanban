import { Space, SpaceMember } from '@/types';

import { apiFetch } from '@/lib/apiClient';

export const spacesApi = {
  getSpaces: (email: string) =>
    apiFetch<Space[]>(`/api/spaces?email=${encodeURIComponent(email)}`),
  createSpace: (data: { name: string; userId: string; userEmail: string }) =>
    apiFetch<Space>('/api/spaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  bootstrap: (data: { userId: string; userEmail: string; userName?: string }) =>
    apiFetch<Space[]>('/api/spaces/bootstrap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  getMembers: (spaceId: string) =>
    apiFetch<SpaceMember[]>(`/api/spaces/${spaceId}/members`),
  inviteMember: (
    spaceId: string,
    data: {
      email: string;
      role?: 'owner' | 'admin' | 'member';
      inviterName?: string;
      inviterEmail?: string;
    }
  ) =>
    apiFetch<SpaceMember[]>(`/api/spaces/${spaceId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};
