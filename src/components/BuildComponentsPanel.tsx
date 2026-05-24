import React from 'react';
import type { Component } from '../models/projects';

interface BuildComponentsPanelProps {
  components: Component[];
  onAddComponent: (name: string) => void;
}

export function BuildComponentsPanel({ components, onAddComponent }: BuildComponentsPanelProps) {
  const [name, setName] = React.useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAddComponent(trimmed);
    setName('');
  }

  return (
    <section className="card-surface p-3 sm:p-4 flex flex-col gap-2 text-xs">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
            Components
          </h3>
          <p className="text-[11px] text-slate-500">
            Break this build into armor pieces, soft parts, props, and electronics.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 mb-2">
        <div className="flex flex-col gap-1">
          <label className="label">New Component</label>
          <input
            className="input-field min-w-[140px]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Helmet, Chest, Boots"
          />
        </div>
        <button type="submit" className="btn-secondary mt-1 px-3 py-1 text-[11px]">
          Add Component
        </button>
      </form>

      {components.length === 0 ? (
        <p className="text-[11px] text-slate-500">No components yet. Add your first above.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-3">
          {components.map((c) => (
            <div
              key={c.id}
              className="border border-slate-700 rounded-md px-2 py-2 bg-slate-900/70 flex flex-col gap-1"
            >
              <div className="text-[12px] font-semibold text-slate-100 truncate">{c.name}</div>
              <div className="flex flex-wrap gap-1 text-[10px] text-slate-500">
                <span className="px-1.5 py-0.5 rounded-full border border-slate-700">
                  {c.type}
                </span>
                <span className="px-1.5 py-0.5 rounded-full border border-slate-700">
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
