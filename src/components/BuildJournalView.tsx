import React from 'react';
import type { Task } from '../models/projects';
import type { ApiPhase } from '../lib/api';
import type { Component } from '../models/projects';

interface BuildJournalViewProps {
  tasks: Task[];
  phases: ApiPhase[];
  components: Component[];
  onSelectTask: (task: Task) => void;
}

export function BuildJournalView({ tasks, phases, components, onSelectTask }: BuildJournalViewProps) {
  if (!tasks.length) {
    return (
      <div className="card-surface p-4 sm:p-5 text-xs text-slate-400">
        No activity yet. As you create tasks, add notes, and attach photos, they will appear here as
        a chronological build log.
      </div>
    );
  }

  const phaseMap = new Map(phases.map((p) => [p.id, p]));
  const componentMap = new Map(components.map((c) => [c.id, c]));

  const sorted = [...tasks].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="card-surface p-4 sm:p-5 text-xs flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
      <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase mb-1">
        Build Journal
      </h2>
      <p className="text-[11px] text-slate-500 mb-2">
        Chronological view of this build. Click an entry to open full details, vendors, and
        photos.
      </p>

      <div className="relative pl-3 border-l border-slate-800 flex flex-col gap-3">
        {sorted.map((task) => {
          const phase = task.phaseId ? phaseMap.get(task.phaseId) : undefined;
          const component = task.componentId ? componentMap.get(task.componentId) : undefined;

          return (
            <button
              key={task.id}
              type="button"
              onClick={() => onSelectTask(task)}
              className="text-left flex gap-3 items-start group"
            >
              <span className="mt-1 h-2 w-2 rounded-full bg-imperial-red shadow-[0_0_0_3px_rgba(248,113,113,0.3)]" />
              <div className="flex-1 border border-slate-800 rounded-md px-3 py-2 bg-slate-900/70 group-hover:border-imperial-red/70 transition-colors">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                  <div className="font-semibold text-slate-100 text-[12px] truncate">
                    {task.title}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(task.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-1 text-[9px] text-slate-400">
                  {phase && (
                    <span className="px-1.5 py-0.5 rounded-full border border-slate-700">
                      {phase.name}
                    </span>
                  )}
                  {component && (
                    <span className="px-1.5 py-0.5 rounded-full border border-slate-700">
                      {component.name}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded-full border border-slate-700">
                    {task.status}
                  </span>
                  <span>
                    {task.vendors.length} vendors • {task.images?.length ?? 0} photos
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 line-clamp-3">
                  {task.descriptionHtml
                    ? 'Notes added — click to view and edit in detail.'
                    : 'No detailed notes yet — click to add CRL references, measurements, and steps.'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
