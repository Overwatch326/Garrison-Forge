// Per-project CRL-style checklists with body areas (e.g. Head, Torso) and items (e.g. Helmet).
// Front-end only for now, stored in localStorage so each build can track its own checklist.

export type ChecklistStatus = 'planned' | 'in-progress' | 'done';

export interface ChecklistImage {
  id: string;
  dataUrl: string;
  annotatedDataUrl?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  status: ChecklistStatus;
  builderNotesHtml?: string;
  gmlNotesHtml?: string;
  images?: ChecklistImage[];
}

export interface ChecklistArea {
  id: string;
  name: string; // e.g. Head, Torso, Legs
  items: ChecklistItem[];
}

export interface ProjectChecklist {
  projectId: string;
  areas: ChecklistArea[];
  updatedAt: string;
}

interface ChecklistState {
  checklists: ProjectChecklist[];
}

const STORAGE_KEY = 'garrison-forge-project-checklists-v1';

function nowIso() {
  return new Date().toISOString();
}

function loadState(): ChecklistState {
  if (typeof window === 'undefined') return { checklists: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { checklists: [] };
    const parsed = JSON.parse(raw) as ChecklistState;
    return { checklists: parsed.checklists ?? [] };
  } catch {
    return { checklists: [] };
  }
}

function saveState(state: ChecklistState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore for now
  }
}

let state: ChecklistState = { checklists: [] };
if (typeof window !== 'undefined') {
  state = loadState();
}

export const ProjectChecklistStore = {
  getForProject(projectId: string): ProjectChecklist {
    const existing = state.checklists.find((c) => c.projectId === projectId);
    if (existing) return existing;
    const created: ProjectChecklist = { projectId, areas: [], updatedAt: nowIso() };
    state = { ...state, checklists: [...state.checklists, created] };
    saveState(state);
    return created;
  },

  saveForProject(projectId: string, areas: ChecklistArea[]): ProjectChecklist {
    const existingIndex = state.checklists.findIndex((c) => c.projectId === projectId);
    const updated: ProjectChecklist = { projectId, areas, updatedAt: nowIso() };
    if (existingIndex >= 0) {
      const next = state.checklists.slice();
      next[existingIndex] = updated;
      state = { ...state, checklists: next };
    } else {
      state = { ...state, checklists: [...state.checklists, updated] };
    }
    saveState(state);
    return updated;
  },
};
