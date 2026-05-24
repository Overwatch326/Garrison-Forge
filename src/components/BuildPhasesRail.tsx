import React from 'react';
import type { PhaseId } from '../models/projects';
import type { ApiPhase } from '../lib/api';

interface BuildPhasesRailProps {
  phases: ApiPhase[];
  activePhaseId: PhaseId | null;
  onSelectPhase: (id: PhaseId | null) => void;
}

export function BuildPhasesRail({ phases, activePhaseId, onSelectPhase }: BuildPhasesRailProps) {
  if (!phases.length) return null;

  return (
    <div className="flex flex-col gap-1 mb-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
          Phases
        </h3>
        <button
          type="button"
          className="text-[10px] text-slate-500 hover:text-slate-200"
          onClick={() => onSelectPhase(null)}
        >
          {activePhaseId ? 'Show all phases' : 'Viewing all phases'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {phases
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((phase) => {
            const isActive = phase.id === activePhaseId;
            return (
              <button
                key={phase.id}
                type="button"
                onClick={() => onSelectPhase(isActive ? null : phase.id)}
                className={`px-2 py-1 rounded-full border text-[10px] transition-colors ${
                  isActive
                    ? 'border-imperial-red bg-imperial-red/20 text-slate-100'
                    : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-imperial-red/70'
                }`}
              >
                {phase.name}
              </button>
            );
          })}
      </div>
    </div>
  );
}
