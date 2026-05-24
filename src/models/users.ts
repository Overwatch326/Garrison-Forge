import { defaultRoles, Role } from './roles';

export type UserId = string;

export interface UserProfile {
  avatarDataUrl?: string;
  bio?: string;
  signatureHtml?: string;
  legionId?: string; // e.g. TK-####
}

export interface User {
  id: UserId;
  email: string;
  displayName: string;
  role: Role;
  profile?: UserProfile;
}

interface UserState {
  users: User[];
}

const STORAGE_KEY = 'garrison-forge-users-v1';

function loadState(): UserState {
  if (typeof window === 'undefined') return { users: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { users: [] };
    const parsed = JSON.parse(raw) as UserState;
    if (!parsed.users) return { users: [] };
    return {
      users: parsed.users.map((u) => ({
        ...u,
        role: u.role && u.role.id === defaultRoles.admin.id ? defaultRoles.admin : defaultRoles.member,
        profile: u.profile || {},
      })),
    };
  } catch {
    return { users: [] };
  }
}

function saveState(state: UserState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

let state: UserState = { users: [] };

if (typeof window !== 'undefined') {
  state = loadState();
}

export const UsersStore = {
  getAll(): User[] {
    return [...state.users];
  },

  getById(id: UserId): User | undefined {
    return state.users.find((u) => u.id === id);
  },

  getByEmail(email: string): User | undefined {
    return state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  register(email: string, displayName: string, password: string): User {
    // NOTE: password is ignored in this prototype; real auth will live on the backend.
    const existing = this.getByEmail(email);
    if (existing) {
      return existing;
    }

    const isFirstUser = state.users.length === 0;
    const role = isFirstUser ? defaultRoles.admin : defaultRoles.member;

    const user: User = {
      id: crypto.randomUUID(),
      email,
      displayName,
      role,
      profile: {},
    };

    state = { users: [...state.users, user] };
    saveState(state);
    return user;
  },

  login(email: string, _password: string): User | null {
    const existing = this.getByEmail(email);
    return existing ?? null;
  },

  updateUserRole(userId: UserId, role: Role): User | null {
    const idx = state.users.findIndex((u) => u.id === userId);
    if (idx === -1) return null;
    state.users[idx] = { ...state.users[idx], role };
    saveState(state);
    return state.users[idx];
  },

  updateDisplayName(userId: UserId, displayName: string): User | null {
    const idx = state.users.findIndex((u) => u.id === userId);
    if (idx === -1) return null;
    state.users[idx] = { ...state.users[idx], displayName };
    saveState(state);
    return state.users[idx];
  },

  updateProfile(userId: UserId, patch: Partial<UserProfile>): User | null {
    const idx = state.users.findIndex((u) => u.id === userId);
    if (idx === -1) return null;
    const existing = state.users[idx];
    const profile: UserProfile = { ...(existing.profile || {}), ...patch };
    state.users[idx] = { ...existing, profile };
    saveState(state);
    return state.users[idx];
  },
};
