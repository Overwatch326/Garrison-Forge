"use client";

import { useState } from "react";
import { Role, createInitialRoleState } from "../models/roles";

export function RoleSettingsPanel() {
  const [state, setState] = useState(createInitialRoleState);
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLevel, setNewLevel] = useState(20);

  function handleAddRole(e: React.FormEvent) {
    e.preventDefault();
    const id = newLabel.trim().toLowerCase().replace(/\s+/g, "-");
    if (!id) return;

    setState((prev) => {
      if (prev.roles.some((r) => r.id === id)) return prev;
      const next: Role = {
        id,
        label: newLabel.trim(),
        description: newDescription.trim() || undefined,
        level: newLevel,
      };
      return { roles: [...prev.roles, next].sort((a, b) => b.level - a.level) };
    });

    setNewLabel("");
    setNewDescription("");
    setNewLevel(20);
  }

  function handleDeleteRole(role: Role) {
    if (role.system) return;
    setState((prev) => ({ roles: prev.roles.filter((r) => r.id !== role.id) }));
  }

  return (
    <div className="card-surface p-4 sm:p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
          Security Levels & Roles
        </h2>
        <p className="text-[11px] text-slate-400 mt-1">
          Configure additional roles and access levels beyond Admin and Member. This is a
          front-end preview; persistence & enforcement will be wired to the backend later.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            Existing Roles
          </h3>
          <div className="space-y-2 text-sm max-h-64 overflow-y-auto pr-1">
            {state.roles.map((role) => (
              <div
                key={role.id}
                className="flex items-start justify-between gap-2 rounded-md border border-slate-800/80 bg-slate-900/60 px-3 py-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="badge-role">{role.label}</span>
                    <span className="text-[10px] text-slate-500">Level {role.level}</span>
                    {role.system && (
                      <span className="text-[9px] uppercase tracking-wider text-red-400/80">
                        System
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{role.description}</p>
                  )}
                </div>
                {!role.system && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRole(role)}
                    className="text-[11px] text-slate-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleAddRole} className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            Add New Role
          </h3>
          <div className="flex flex-col gap-1">
            <label className="label">Title</label>
            <input
              className="input-field"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Garrison Staff, Squad Leader"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="label">Description</label>
            <textarea
              className="input-field min-h-[72px] resize-y"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="What can this role do? What areas does it control?"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="label">Security Level</label>
            <input
              type="number"
              min={1}
              max={100}
              className="input-field max-w-[120px]"
              value={newLevel}
              onChange={(e) => setNewLevel(Number(e.target.value) || 1)}
            />
            <p className="text-[11px] text-slate-500 mt-0.5">
              Higher numbers mean more powerful roles. Admin is 100, Member is 10.
            </p>
          </div>

          <button type="submit" className="btn-secondary mt-2">
            Add Role
          </button>
        </form>
      </div>
    </div>
  );
}
