// Simple global resource library so each build enriches future builds.
// This is front-end only and stored in localStorage for now.

export interface ResourceEntry {
  id: string;
  name: string; // vendor or resource name
  item: string; // what is being purchased
  cost?: number;
  website?: string;
  notes?: string;
  costumeTypeUsed?: string;
  projectIdUsed?: string;
  createdAt: string;
}

interface ResourceLibraryState {
  entries: ResourceEntry[];
}

const STORAGE_KEY = 'garrison-forge-resource-library-v1';

function nowIso() {
  return new Date().toISOString();
}

function loadState(): ResourceLibraryState {
  if (typeof window === 'undefined') return { entries: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [] };
    const parsed = JSON.parse(raw) as ResourceLibraryState;
    return { entries: parsed.entries ?? [] };
  } catch {
    return { entries: [] };
  }
}

function saveState(state: ResourceLibraryState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

let state: ResourceLibraryState = { entries: [] };
if (typeof window !== 'undefined') {
  state = loadState();
}

export const ResourceLibraryStore = {
  getAll(): ResourceEntry[] {
    return state.entries.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  getForProject(projectId: string): ResourceEntry[] {
    return this.getAll().filter((e) => e.projectIdUsed === projectId);
  },

  add(entry: Omit<ResourceEntry, 'id' | 'createdAt'>): ResourceEntry {
    const full: ResourceEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: nowIso(),
    };
    state = { ...state, entries: [full, ...state.entries] };
    saveState(state);
    return full;
  },
};
