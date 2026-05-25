"use client";

import { useEffect, useState } from 'react';
import { CrlTemplateStore, type CrlAreaTemplate } from '../models/crlTemplates';

export function ChecklistSettingsPanel() {
  const [areas, setAreas] = useState<CrlAreaTemplate[]>([]);
  const [newAreaName, setNewAreaName] = useState('');

  useEffect(() => {
    setAreas(CrlTemplateStore.getAreas());
  }, []);

  function refresh() {
    setAreas(CrlTemplateStore.getAreas());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card-surface p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
          CRL Checklist Areas
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Define the shared body areas used in build checklists (for example: Head, Torso, Arms,
          Legs). Builders will attach specific items (Helmet, Chest, Boots) to these areas on each
          build.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newAreaName.trim()) return;
            CrlTemplateStore.addArea(newAreaName.trim());
            setNewAreaName('');
            refresh();
          }}
          className="mt-3 flex flex-wrap items-end gap-2 text-xs"
        >
          <div className="flex flex-col gap-1">
            <label className="label">New Area</label>
            <input
              className="input-field min-w-[160px]"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              placeholder="e.g. Head, Torso, Legs"
            />
          </div>
          <button type="submit" className="btn-secondary mt-1">
            Add Area
          </button>
        </form>
      </div>

      <div className="card-surface p-4 sm:p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-2">
          Defined Areas
        </h3>
        {areas.length === 0 ? (
          <p className="text-[11px] text-slate-500">No areas defined yet. Add one above.</p>
        ) : (
          <div className="flex flex-col gap-1 text-[11px]">
            {areas.map((area) => (
              <div
                key={area.id}
                className="flex items-center justify-between gap-2 border border-slate-800 rounded-md px-2 py-1 bg-slate-950/60"
              >
                <span className="text-slate-100">{area.name}</span>
                <button
                  type="button"
                  className="text-[10px] text-slate-500 hover:text-imperial-red"
                  onClick={() => {
                    CrlTemplateStore.deleteArea(area.id);
                    refresh();
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
