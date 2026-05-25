// Wire up UI to ThreadStore + ImageEditor.

(function () {
  const projectNameInput = document.getElementById('project-name');
  const projectTypeInput = document.getElementById('project-type');
  const threadListEl = document.getElementById('thread-list');
  const newEntryBtn = document.getElementById('new-entry-btn');

  const entryForm = document.getElementById('entry-form');
  const entryIdInput = document.getElementById('entry-id');
  const entryTitleInput = document.getElementById('entry-title');
  const entryNotesInput = document.getElementById('entry-notes');
  const entryStageSelect = document.getElementById('entry-stage');
  const deleteBtn = document.getElementById('delete-entry');
  const exportJsonBtn = document.getElementById('export-json-btn');
  const exportMarkdownBtn = document.getElementById('export-markdown-btn');
  const importJsonBtn = document.getElementById('import-json-btn');
  const importJsonInput = document.getElementById('import-json-input');
  const crlItemsEl = document.getElementById('crl-items');
  const crlSubtitleEl = document.getElementById('crl-subtitle');

  let currentEntryId = null;
  let lastImageForEntry = null;

  if (!window.ThreadStore || !window.ImageEditor) {
    console.warn('ThreadStore or ImageEditor missing');
    return;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString();
  }

  function renderCrl(meta) {
    if (!window.Crl) return;
    const type = meta.projectType || projectTypeInput.value;
    const config = Crl.getConfigForType(type);

    crlItemsEl.innerHTML = '';

    if (!config) {
      crlSubtitleEl.textContent = 'Set Armor Type above to load a starter checklist.';
      return;
    }

    crlSubtitleEl.textContent = config.label;
    const storedStatuses = (meta && meta.crlStatus) || {};

    config.items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'crl-item';

      const label = document.createElement('span');
      label.className = 'crl-item-label';
      label.textContent = item.label;

      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'crl-status-pill';
      const status = storedStatuses[item.id] || 'planned';
      pill.dataset.status = status;

      function statusLabel(s) {
        if (s === 'done') return 'Done';
        if (s === 'in-progress') return 'In Progress';
        return 'Planned';
      }

      pill.textContent = statusLabel(status);

      pill.addEventListener('click', () => {
        const current = pill.dataset.status || 'planned';
        const next = current === 'planned' ? 'in-progress' : current === 'in-progress' ? 'done' : 'planned';
        pill.dataset.status = next;
        pill.textContent = statusLabel(next);

        const existing = ThreadStore.getMeta('crlStatus') || {};
        const updated = { ...existing, [item.id]: next };
        ThreadStore.setMeta('crlStatus', updated);
      });

      row.appendChild(label);
      row.appendChild(pill);
      crlItemsEl.appendChild(row);
    });
  }

  function renderThreadList(state) {
    threadListEl.innerHTML = '';
    if (!state.entries.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No updates yet. Hit "New Update" to start your build thread.';
      empty.className = 'empty-thread-hint';
      threadListEl.appendChild(empty);
      return;
    }

    state.entries.forEach((entry) => {
      const item = document.createElement('article');
      item.className = 'thread-item';
      if (entry.id === currentEntryId) item.classList.add('active');

      const titleRow = document.createElement('div');
      titleRow.className = 'thread-item-title-row';

      const title = document.createElement('div');
      title.className = 'thread-item-title';
      title.textContent = entry.title || 'Untitled update';

      const stageBadge = document.createElement('span');
      stageBadge.className = 'stage-badge';
      const stage = entry.stage || 'research';
      const STAGE_LABELS = {
        research: 'Research',
        build: 'Build',
        fit: 'Fit / Test Fit',
        approval: 'Approval',
      };
      stageBadge.textContent = STAGE_LABELS[stage] || 'Research';
      stageBadge.dataset.stage = stage;

      titleRow.appendChild(title);
      titleRow.appendChild(stageBadge);

      const meta = document.createElement('div');
      meta.className = 'thread-item-meta';

      const dateSpan = document.createElement('span');
      dateSpan.textContent = formatDate(entry.updatedAt || entry.createdAt);

      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = entry.imageDataUrl ? 'Image + Markup' : 'Notes only';

      meta.appendChild(dateSpan);
      meta.appendChild(badge);

      item.appendChild(titleRow);
      item.appendChild(meta);

      item.addEventListener('click', () => {
        openEntry(entry.id);
      });

      threadListEl.appendChild(item);
    });
  }

  function openEntry(id) {
    const entry = ThreadStore.getEntry(id);
    if (!entry) return;

    currentEntryId = id;
    entryIdInput.value = entry.id;
    entryTitleInput.value = entry.title || '';
    entryNotesInput.value = entry.notes || '';
    entryStageSelect.value = entry.stage || 'research';
    deleteBtn.disabled = false;

    if (entry.imageDataUrl || entry.canvasDataUrl) {
      ImageEditor.loadSnapshot({
        base: entry.imageDataUrl,
        merged: entry.canvasDataUrl,
      });
      lastImageForEntry = entry.imageDataUrl;
    } else {
      ImageEditor.clearCanvas();
      lastImageForEntry = null;
    }

    ThreadStore.subscribe((state) => {
      renderThreadList(state);
    });
  }

  function resetForm() {
    currentEntryId = null;
    entryIdInput.value = '';
    entryTitleInput.value = '';
    entryNotesInput.value = '';
    entryStageSelect.value = 'research';
    deleteBtn.disabled = true;
    lastImageForEntry = null;
    ImageEditor.clearCanvas();
  }

  const unsubscribe = ThreadStore.subscribe((state) => {
    if (typeof state.meta.projectName === 'string') {
      projectNameInput.value = state.meta.projectName;
    }
    if (typeof state.meta.projectType === 'string') {
      projectTypeInput.value = state.meta.projectType;
    }
    renderThreadList(state);
    renderCrl(state.meta || {});
  });

  projectNameInput.addEventListener('input', (e) => {
    ThreadStore.setMeta('projectName', e.target.value);
  });

  projectTypeInput.addEventListener('input', (e) => {
    ThreadStore.setMeta('projectType', e.target.value);
    const state = ThreadStore.exportState();
    renderCrl(state.meta || {});
  });

  newEntryBtn.addEventListener('click', () => {
    resetForm();
    entryTitleInput.focus();
  });

  entryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = entryTitleInput.value.trim() || 'Untitled update';
    const notes = entryNotesInput.value.trim();
    const stage = entryStageSelect.value || 'research';

    const snap = ImageEditor.getSnapshot();
    const payload = {
      title,
      notes,
      stage,
      imageDataUrl: snap.base || lastImageForEntry,
      canvasDataUrl: snap.merged || null,
    };

    if (currentEntryId) {
      ThreadStore.updateEntry(currentEntryId, payload);
    } else {
      const created = ThreadStore.createEntry(payload);
      currentEntryId = created.id;
      entryIdInput.value = created.id;
      deleteBtn.disabled = false;
    }
  });

  deleteBtn.addEventListener('click', () => {
    if (!currentEntryId) return;
    const ok = confirm('Delete this update from your build thread?');
    if (!ok) return;
    ThreadStore.deleteEntry(currentEntryId);
    resetForm();
  });

  window.addEventListener('imageLoadedForEntry', (event) => {
    lastImageForEntry = event.detail.imageDataUrl;
  });

  window.addEventListener('canvasClearedForEntry', () => {
    lastImageForEntry = null;
  });

  exportJsonBtn.addEventListener('click', () => {
    const state = ThreadStore.exportState();
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const name = projectNameInput.value.trim() || 'build-thread';
    a.href = url;
    a.download = `${name.replace(/\s+/g, '-').toLowerCase()}-thread.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  importJsonBtn.addEventListener('click', () => {
    importJsonInput.click();
  });

  importJsonInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        ThreadStore.importState(parsed);
      } catch (err) {
        console.error('Failed to import JSON', err);
        alert('Could not import JSON: invalid format.');
      } finally {
        importJsonInput.value = '';
      }
    };
    reader.readAsText(file);
  });

  exportMarkdownBtn.addEventListener('click', () => {
    const state = ThreadStore.exportState();
    const lines = [];

    const name = state.meta.projectName || 'Build Thread';
    const type = state.meta.projectType || '';
    lines.push(`# ${name}`);
    if (type) {
      lines.push(`_Armor Type: ${type}_`);
    }
    lines.push('');

    if (state.meta.crlStatus && window.Crl) {
      const config = Crl.getConfigForType(type);
      if (config) {
        lines.push('## CRL Checklist');
        config.items.forEach((item) => {
          const status = state.meta.crlStatus[item.id] || 'planned';
          const mark = status === 'done' ? '✅' : status === 'in-progress' ? '🟡' : '⬜';
          lines.push(`- ${mark} ${item.label}`);
        });
        lines.push('');
      }
    }

    const STAGE_LABELS = {
      research: 'Research',
      build: 'Build',
      fit: 'Fit / Test Fit',
      approval: 'Approval',
    };

    state.entries
      .slice()
      .reverse()
      .forEach((entry) => {
        const when = formatDate(entry.updatedAt || entry.createdAt);
        const stage = STAGE_LABELS[entry.stage || 'research'] || 'Research';
        lines.push(`## ${entry.title || 'Untitled update'}`);
        lines.push(`_Stage: ${stage} • Updated: ${when}_`);
        lines.push('');
        if (entry.notes) {
          lines.push(entry.notes);
          lines.push('');
        }
        if (entry.imageDataUrl) {
          lines.push('_(Image attached in exported data URL; upload separately to forums.)_');
          lines.push('');
        }
      });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (name || 'build-thread').replace(/\s+/g, '-').toLowerCase();
    a.href = url;
    a.download = `${safeName}-thread.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  window.addEventListener('beforeunload', () => {
    unsubscribe && unsubscribe();
  });
})();
