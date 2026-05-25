"use client";

import { useEffect, useState } from 'react';
import {
  ProjectStore,
  type Project,
  type TaskStatus,
} from '../models/projects';
import { UsersStore, type User } from '../models/users';

const STATUS_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'research', label: 'Research' },
  { id: 'ordering', label: 'Ordering' },
  { id: 'build', label: 'Build' },
  { id: 'approval', label: 'Approval' },
];

interface OverviewBoardProps {
  currentUser: User;
  onNewBuild?: () => void;
  onOpenBuild?: (projectId: string) => void;
}

export function OverviewBoard({ currentUser, onNewBuild, onOpenBuild }: OverviewBoardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);

  useEffect(() => {
    const userProjects = ProjectStore.getProjectsForUser(currentUser.id);
    setProjects(userProjects);
  }, [currentUser.id]);

  function handleDropOnStatus(status: TaskStatus) {
    if (!draggedProjectId) return;
    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === draggedProjectId ? { ...p, pipelineStatus: status } : p,
      );
      ProjectStore.updateProject(draggedProjectId, { pipelineStatus: status });
      return updated;
    });
    setDraggedProjectId(null);
  }

  const totalBuilds = projects.length;
  const totalTasks = projects.reduce((acc, p) => acc + ProjectStore.getTasksForProject(p.id).length, 0);
  const tasksByStatus: Record<TaskStatus, number> = {
    research: projects.filter((p) => (p.pipelineStatus ?? 'research') === 'research').length,
    ordering: projects.filter((p) => p.pipelineStatus === 'ordering').length,
    build: projects.filter((p) => p.pipelineStatus === 'build').length,
    approval: projects.filter((p) => p.pipelineStatus === 'approval').length,
  };

  const activeUser = UsersStore.getAll().find((u) => u.id === currentUser.id) || currentUser;

  return (
    <section className="flex flex-col gap-4">
      <div className="card-surface p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
              Build Overview
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              High-level view of all your builds and steps across research, ordering, build, and
              approval.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <div>
              <span className="font-semibold text-slate-200">Member:</span>{' '}
              {activeUser.displayName || activeUser.email}
            </div>
            {onNewBuild && (
              <button
                type="button"
                onClick={onNewBuild}
                className="btn-secondary px-2 py-1 text-[10px]"
              >
                New Build
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Total Builds</p>
            <p className="text-lg font-semibold text-slate-100">{totalBuilds}</p>
            <p className="text-[11px] text-slate-500">Projects you are tracking in this workspace.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Total Steps</p>
            <p className="text-lg font-semibold text-slate-100">{totalTasks}</p>
            <p className="text-[11px] text-slate-500">Individual tasks across all builds.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">By Phase</p>
            <p className="text-[11px] text-slate-300 flex flex-wrap gap-x-3 gap-y-1">
              <span>Research: {tasksByStatus.research}</span>
              <span>Ordering: {tasksByStatus.ordering}</span>
              <span>Build: {tasksByStatus.build}</span>
              <span>Approval: {tasksByStatus.approval}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="card-surface p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Builds by Stage
          </h3>
          <p className="text-[11px] text-slate-500">
            Each card represents a build, grouped by its current pipeline stage.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {STATUS_COLUMNS.map((col) => (
            <div
              key={col.id}
              className="bg-slate-900/60 border border-slate-800 rounded-lg p-2 flex flex-col gap-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropOnStatus(col.id)}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  {col.label}
                </h4>
                <span className="text-[10px] text-slate-500">
                  {projects.filter((p) => (p.pipelineStatus ?? 'research') === col.id).length} builds
                </span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
                {projects
                  .filter((p) => (p.pipelineStatus ?? 'research') === col.id)
                  .map((project) => (
                    <div
                      key={project.id}
                      draggable
                      onDragStart={() => setDraggedProjectId(project.id)}
                      className="border border-slate-800 rounded-md px-2 py-1.5 bg-slate-950/60 hover:border-imperial-red/70 transition-colors cursor-move"
                      onClick={() => onOpenBuild?.(project.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-medium text-slate-100 truncate">
                          {project.name}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {project.costumeType || 'No costume type set'}
                      </p>
                    </div>
                  ))}

                {projects.filter((p) => (p.pipelineStatus ?? 'research') === col.id).length === 0 && (
                  <p className="text-[10px] text-slate-500 italic">No builds in this column yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
