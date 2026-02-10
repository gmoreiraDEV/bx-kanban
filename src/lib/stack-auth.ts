import { useSyncExternalStore } from 'react';

import { Space, User } from '@/types';
import { spacesApi } from '@/lib/spacesApi';

type StoredSession = {
  user: User | null;
  currentSpaceId: string | null;
};

type Snapshot = {
  user: User | null;
  spaces: Space[];
  currentSpaceId: string | null;
};

const STORAGE_KEY = 'stack_auth_session';

const userIdFromEmail = (email: string) => {
  const localPart = email.split('@')[0] ?? email;
  const normalized = localPart
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'user';

  return `user-${normalized}`;
};

class StackAuthClient {
  private user: User | null = null;
  private spaces: Space[] = [];
  private currentSpaceId: string | null = null;
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.load();
    }
  }

  private getSnapshot = (): Snapshot => ({
    user: this.user,
    spaces: this.spaces,
    currentSpaceId: this.currentSpaceId,
  });

  private subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit() {
    for (const listener of this.listeners) listener();
  }

  private load() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const data = JSON.parse(saved) as StoredSession;
    this.user = data.user;
    this.currentSpaceId = data.currentSpaceId;
  }

  private save() {
    if (typeof window === 'undefined') return;

    const payload: StoredSession = {
      user: this.user,
      currentSpaceId: this.currentSpaceId,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  private setSpaces(spaces: Space[]) {
    this.spaces = spaces;

    const hasCurrent = spaces.some(space => space.id === this.currentSpaceId);
    if (!hasCurrent) {
      this.currentSpaceId = spaces[0]?.id ?? null;
    }

    this.save();
    this.emit();
  }

  private getCurrentSpaceSnapshot() {
    return this.spaces.find(space => space.id === this.currentSpaceId) ?? this.spaces[0] ?? null;
  }

  login(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const localPart = normalizedEmail.split('@')[0] ?? normalizedEmail;

    this.user = {
      id: userIdFromEmail(normalizedEmail),
      email: normalizedEmail,
      name: localPart.charAt(0).toUpperCase() + localPart.slice(1),
    };

    this.save();
    this.emit();
  }

  logout() {
    this.user = null;
    this.spaces = [];
    this.currentSpaceId = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      this.emit();
      window.location.assign('/login');
      return;
    }

    this.emit();
  }

  async ensureBootstrap() {
    if (!this.user) return [];

    const spaces = await spacesApi.bootstrap({
      userId: this.user.id,
      userEmail: this.user.email,
      userName: this.user.name,
    });

    this.setSpaces(spaces);
    return spaces;
  }

  async refreshSpaces() {
    if (!this.user) return [];
    const spaces = await spacesApi.getSpaces(this.user.email);
    this.setSpaces(spaces);
    return spaces;
  }

  useUser() {
    return useSyncExternalStore(this.subscribe, () => this.getSnapshot().user, () => null);
  }

  useSpaces() {
    return useSyncExternalStore(this.subscribe, () => this.getSnapshot().spaces, () => []);
  }

  useCurrentSpace() {
    return useSyncExternalStore(
      this.subscribe,
      () => this.getCurrentSpaceSnapshot(),
      () => null
    );
  }

  switchSpace(spaceId: string) {
    this.currentSpaceId = spaceId;
    this.save();
    this.emit();
  }

  async createSpace(name: string) {
    if (!this.user) return;

    const space = await spacesApi.createSpace({
      name,
      userId: this.user.id,
      userEmail: this.user.email,
      userName: this.user.name,
    });

    const merged = [...this.spaces.filter(item => item.id !== space.id), space];
    this.currentSpaceId = space.id;
    this.setSpaces(merged);
  }

  async inviteMember(email: string) {
    const currentSpace = this.getCurrentSpaceSnapshot();
    if (!currentSpace || !this.user) return;

    const members = await spacesApi.inviteMember(currentSpace.id, {
      email,
      inviterName: this.user.name,
      inviterEmail: this.user.email,
    });

    const updatedSpaces = this.spaces.map(space =>
      space.id === currentSpace.id ? { ...space, members } : space
    );

    this.setSpaces(updatedSpaces);
  }

  async updateMemberName(userId: string, name: string) {
    const currentSpace = this.getCurrentSpaceSnapshot();
    if (!currentSpace) return;

    const members = await spacesApi.updateMemberName(currentSpace.id, { userId, name });
    const updatedSpaces = this.spaces.map(space =>
      space.id === currentSpace.id ? { ...space, members } : space
    );

    this.setSpaces(updatedSpaces);
  }
}

export const stackAuth = new StackAuthClient();
