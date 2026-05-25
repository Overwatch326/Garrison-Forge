// Thread management module
// Handles build thread entries and localStorage persistence.

(function () {
  const STORAGE_KEY = 'build-thread-project-v1';

  function nowIso() {
    return new Date().toISOString();
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { meta: {}, entries: [] };
      const parsed = JSON.parse(raw);
      if (!parsed.entries) parsed.entries = [];
      if (!parsed.meta) parsed.meta = {};
      return parsed;
    } catch (err) {
      console.error('Failed to load state', err);
      return { meta: {}, entries: [] };
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save state', err);
    }
  }

  const state = loadState();

  const subscribers = new Set();

  function notify() {
    const snapshot = { meta: { ...state.meta }, entries: [...state.entries] };
    subscribers.forEach((fn) => fn(snapshot));
    saveState(state);
  }

  const ThreadStore = {
    subscribe(fn) {
      subscribers.add(fn);
      fn({ meta: { ...state.meta }, entries: [...state.entries] });
      return () => subscribers.delete(fn);
    },

    setMeta(key, value) {
      state.meta[key] = value;
      notify();
    },

    getMeta(key) {
      return state.meta[key];
    },

    createEntry(partial) {
      const entry = {
        id: crypto.randomUUID(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        title: partial.title || 'Untitled update',
        notes: partial.notes || '',
        stage: partial.stage || 'research',
        imageDataUrl: partial.imageDataUrl || null,
        canvasDataUrl: partial.canvasDataUrl || null,
      };
      state.entries.unshift(entry);
      notify();
      return entry;
    },

    updateEntry(id, patch) {
      const idx = state.entries.findIndex((e) => e.id === id);
      if (idx === -1) return;
      state.entries[idx] = {
        ...state.entries[idx],
        ...patch,
        updatedAt: nowIso(),
      };
      notify();
      return state.entries[idx];
    },

    deleteEntry(id) {
      const before = state.entries.length;
      state.entries = state.entries.filter((e) => e.id !== id);
      if (state.entries.length !== before) {
        notify();
      }
    },

    getEntry(id) {
      return state.entries.find((e) => e.id === id) || null;
    },

    exportState() {
      return { meta: { ...state.meta }, entries: [...state.entries] };
    },

    importState(newState) {
      if (!newState || typeof newState !== 'object') return;
      const meta = newState.meta && typeof newState.meta === 'object' ? newState.meta : {};
      const entries = Array.isArray(newState.entries) ? newState.entries : [];
      state.meta = { ...meta };
      state.entries = entries.map((e) => ({ ...e }));
      notify();
    },
  };

  window.ThreadStore = ThreadStore;
})();
