"use client";

import React, { useEffect, useState } from 'react';
import type { User } from '../models/users';
import { apiGetUserCostumes, apiCreateUserCostume, apiDeleteUserCostume, type ApiUserCostume } from '../lib/apiCostumes';

interface ProfileCostumesPanelProps {
  currentUser: User;
}

export function ProfileCostumesPanel({ currentUser }: ProfileCostumesPanelProps) {
  const [costumes, setCostumes] = useState<ApiUserCostume[]>([]);
  const [name, setName] = useState('');
  const [costumeType, setCostumeType] = useState('');
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGetUserCostumes(currentUser.id);
        setCostumes(data);
      } catch {
        // ignore for now
      }
    })();
  }, [currentUser.id]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const created = await apiCreateUserCostume(currentUser.id, {
        name: trimmed,
        costumeType: costumeType.trim() || undefined,
        approved,
      });
      setCostumes((prev) => [...prev, created]);
      setName('');
      setCostumeType('');
      setApproved(false);
    } catch {
      // ignore for now
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDeleteUserCostume(id);
      setCostumes((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
  }

  return (
    <section className="card-surface p-4 sm:p-6 flex flex-col gap-3 text-xs text-slate-300">
      <div>
        <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
          My Costumes
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Track the costumes you own or are building. These will be available when signing up for
          events.
        </p>
      </div>

      <form onSubmit={handleAdd} className="grid gap-2 sm:grid-cols-3 items-end max-w-2xl">
        <div className="flex flex-col gap-1">
          <label className="label">Costume Name</label>
          <input
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. ANH Stunt TK, Phase II Rex"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label">Type / Designation</label>
          <input
            className="input-field"
            value={costumeType}
            onChange={(e) => setCostumeType(e.target.value)}
            placeholder="e.g. TK, CC-7567, TB, TI"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label">Approved?</label>
          <label className="inline-flex items-center gap-2 text-[11px] text-slate-400">
            <input
              type="checkbox"
              className="h-3 w-3 rounded border-slate-700 bg-slate-900"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
            />
            <span>Approved / Troop-ready</span>
          </label>
        </div>
        <button type="submit" className="btn-secondary mt-1 px-3 py-1 text-[11px]">
          Add Costume
        </button>
      </form>

      <div className="mt-2 flex flex-col gap-2">
        {costumes.length === 0 ? (
          <p className="text-[11px] text-slate-500">No costumes added yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {costumes.map((c) => (
              <div
                key={c.id}
                className="border border-slate-800 rounded-md px-3 py-2 bg-slate-900/70 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[12px] font-semibold text-slate-100 truncate">{c.name}</div>
                    {c.costumeType && (
                      <div className="text-[10px] text-slate-400">{c.costumeType}</div>
                    )}
                  </div>
                  {c.approved && (
                    <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border border-emerald-500 text-emerald-400">
                      Approved
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="mt-1 text-[10px] text-slate-500 hover:text-red-400 self-end"
                  onClick={() => handleDelete(c.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
