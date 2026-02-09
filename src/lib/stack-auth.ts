
import { User, Space, SpaceMember } from '@/types';

/**
 * SIMULATED STACK AUTH SDK
 */
class StackAuthMock {
  private user: User | null = null;
  private spaces: Space[] = [];
  private currentSpaceId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.load();
    }
  }

  private load() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('stack_auth_session');
    if (saved) {
      const data = JSON.parse(saved);
      this.user = data.user;
      this.spaces = (data.spaces ?? []).map((space: Space) => ({
        ...space,
        teamId: space.teamId ?? space.id,
      }));
      this.currentSpaceId = data.currentSpaceId;
    }
  }

  private save() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('stack_auth_session', JSON.stringify({
      user: this.user,
      spaces: this.spaces,
      currentSpaceId: this.currentSpaceId
    }));
  }

  login(email: string) {
    this.user = {
      id: 'user-' + email.split('@')[0],
      email,
      name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
    };
    
    // Default Space for new user
    if (this.spaces.length === 0) {
      const defaultSpace: Space = {
        id: 'space-' + crypto.randomUUID().slice(0, 8),
        name: 'Personal Workspace',
        teamId: 'team-' + crypto.randomUUID().slice(0, 8),
        ownerId: this.user.id,
        members: [{ userId: this.user.id, email: this.user.email, role: 'owner' }]
      };
      this.spaces.push(defaultSpace);
      this.currentSpaceId = defaultSpace.id;
    }
    this.save();
  }

  logout() {
    this.user = null;
    this.currentSpaceId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stack_auth_session');
      window.location.assign('/login');
    }
  }

  useUser() { return this.user; }
  useSpaces() { return this.spaces; }
  useCurrentSpace() { 
    return this.spaces.find(s => s.id === this.currentSpaceId) || this.spaces[0] || null; 
  }

  switchSpace(spaceId: string) {
    this.currentSpaceId = spaceId;
    this.save();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  createSpace(name: string) {
    if (!this.user) return;
    const newSpace: Space = {
      id: 'space-' + crypto.randomUUID().slice(0, 8),
      name,
      teamId: 'team-' + crypto.randomUUID().slice(0, 8),
      ownerId: this.user.id,
      members: [{ userId: this.user.id, email: this.user.email, role: 'owner' }]
    };
    this.spaces.push(newSpace);
    this.currentSpaceId = newSpace.id;
    this.save();
  }

  inviteMember(email: string) {
    const space = this.useCurrentSpace();
    if (!space) return;
    if (space.members.some(m => m.email === email)) return;
    
    space.members.push({
      userId: 'user-invited-' + Math.random().toString(36).substring(7),
      email,
      role: 'member'
    });
    this.save();
  }
}

export const stackAuth = new StackAuthMock();
