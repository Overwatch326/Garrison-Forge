// Global CRL-style body areas managed via the admin UI.
// These are shared across builds; each project can attach items to these areas.

export interface CrlAreaTemplate {
  id: string;
  name: string; // e.g. Head, Torso, Legs
  order: number;
}

interface CrlTemplateState {
  areas: CrlAreaTemplate[];
}

const STORAGE_KEY = 'garrison-forge-crl-templates-v1';

const DEFAULT_AREAS: { name: string; order: number }[] = [
  { name: 'Head', order: 0 },
  { name: 'Shoulders', order: 1 },
  { name: 'Biceps', order: 2 },
  { name: 'Forearms', order: 3 },
  { name: 'Hands / Gloves', order: 4 },
  { name: 'Torso / Chest', order: 5 },
  { name: 'Back', order: 6 },
  { name: 'Abdomen / Kidney / Butt', order: 7 },
  { name: 'Cod', order: 8 },
  { name: 'Belt', order: 9 },
  { name: 'Thighs', order: 10 },
  { name: 'Knees', order: 11 },
  { name: 'Shins', order: 12 },
  { name: 'Boots', order: 13 },
  { name: 'Accessories / Weapons', order: 14 },
];

function loadState(): CrlTemplateState {
  if (typeof window === 'undefined') return { areas: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with sensible defaults on first run
      return {
        areas: DEFAULT_AREAS.map((a) => ({
          id: crypto.randomUUID(),
          name: a.name,
          order: a.order,
        })),
      };
    }
    const parsed = JSON.parse(raw) as CrlTemplateState;
    return {
      areas: (parsed.areas ?? []).map((a, idx) => ({
        id: a.id || crypto.randomUUID(),
        name: a.name,
        order: typeof a.order === 'number' ? a.order : idx,
      })),
    };
  } catch {
    return { areas: [] };
  }
}

function saveState(state: CrlTemplateState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

let state: CrlTemplateState = { areas: [] };
if (typeof window !== 'undefined') {
  state = loadState();
}

export const CrlTemplateStore = {
  getAreas(): CrlAreaTemplate[] {
    return state.areas.slice().sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  },

  addArea(name: string): CrlAreaTemplate {
    const nextOrder = state.areas.length ? Math.max(...state.areas.map((a) => a.order)) + 1 : 0;
    const area: CrlAreaTemplate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      order: nextOrder,
    };
    state = { ...state, areas: [...state.areas, area] };
    saveState(state);
    return area;
  },

  updateArea(id: string, name: string): CrlAreaTemplate | null {
    const idx = state.areas.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    state.areas[idx] = { ...state.areas[idx], name: name.trim(), order: state.areas[idx].order };
    saveState(state);
    return state.areas[idx];
  },

  deleteArea(id: string): void {
    state = { ...state, areas: state.areas.filter((a) => a.id !== id) };
    saveState(state);
  },
};
