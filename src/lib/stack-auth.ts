import { useSyncExternalStore } from 'react';

import { Space, User } from '@/types';
import { spacesApi } from '@/lib/spacesApi';
import { stackClientApp } from '@/stack/client';

type Snapshot = {
  spaces: Space[];
  currentSpaceId: string | null;
};

const CURRENT_SPACE_STORAGE_KEY = 'stack_current_space_id';

const fallbackDisplayNameFromEmail = (email: string) => {
  const localPart = email.split('@')[0] ?? email;
  if (!localPart) return 'User';
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
};

const mapStackUserToAppUser = (
  stackUser:
    | {
        id: string;
        primaryEmail: string | null;
        displayName: string | null;
      }
    | null
    | undefined
): User | null => {
  if (!stackUser?.primaryEmail) return null;

  const email = stackUser.primaryEmail.trim().toLowerCase();
  if (!email) return null;

  return {
    id: stackUser.id,
    email,
    name: stackUser.displayName?.trim() || fallbackDisplayNameFromEmail(email),
  };
};

class StackAuthClient {
  private spaces: Space[] = [];
  private currentSpaceId: string | null =
    typeof window === 'undefined' ? null : window.localStorage.getItem(CURRENT_SPACE_STORAGE_KEY);
  private listeners = new Set<() => void>();

  private getSnapshot = (): Snapshot => ({
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

  private saveCurrentSpaceId() {
    if (typeof window === 'undefined') return;
    if (this.currentSpaceId) {
      window.localStorage.setItem(CURRENT_SPACE_STORAGE_KEY, this.currentSpaceId);
      return;
    }
    window.localStorage.removeItem(CURRENT_SPACE_STORAGE_KEY);
  }

  private setSpaces(spaces: Space[]) {
    this.spaces = spaces;

    const hasCurrent = spaces.some(space => space.id === this.currentSpaceId);
    if (!hasCurrent) {
      this.currentSpaceId = spaces[0]?.id ?? null;
    }

    this.saveCurrentSpaceId();
    this.emit();
  }

  private clearSpaces() {
    this.spaces = [];
    this.currentSpaceId = null;
    this.saveCurrentSpaceId();
    this.emit();
  }

  private async getCurrentUser() {
    try {
      const stackUser = await stackClientApp.getUser();
      return mapStackUserToAppUser(stackUser);
    } catch {
      return null;
    }
  }

  private getCurrentSpaceSnapshot() {
    return this.spaces.find(space => space.id === this.currentSpaceId) ?? this.spaces[0] ?? null;
  }

  login(_email: string) {
    if (typeof window === 'undefined') return;
    window.location.assign('/handler/sign-in');
  }

  async logout() {
    this.clearSpaces();

    try {
      await stackClientApp.signOut({ redirectUrl: '/login' });
    } catch {
      if (typeof window !== 'undefined') {
        window.location.assign('/login');
      }
    }
  }

  async ensureBootstrap() {
    const user = await this.getCurrentUser();
    if (!user) {
      this.clearSpaces();
      return [];
    }

    const spaces = await spacesApi.bootstrap({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
    });

    this.setSpaces(spaces);
    return spaces;
  }

  async refreshSpaces() {
    const user = await this.getCurrentUser();
    if (!user) {
      this.clearSpaces();
      return [];
    }

    const spaces = await spacesApi.getSpaces();
    this.setSpaces(spaces);
    return spaces;
  }

  useUser() {
    const stackUser = stackClientApp.useUser();
    return mapStackUserToAppUser(stackUser);
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
    this.saveCurrentSpaceId();
    this.emit();
  }

  async createSpace(name: string) {
    const user = await this.getCurrentUser();
    if (!user) return;

    const space = await spacesApi.createSpace({
      name,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
    });

    const merged = [...this.spaces.filter(item => item.id !== space.id), space];
    this.currentSpaceId = space.id;
    this.setSpaces(merged);
  }

  async inviteMember(email: string) {
    const currentSpace = this.getCurrentSpaceSnapshot();
    const user = await this.getCurrentUser();
    if (!currentSpace || !user) return;

    const members = await spacesApi.inviteMember(currentSpace.id, {
      email,
      inviterName: user.name,
      inviterEmail: user.email,
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
