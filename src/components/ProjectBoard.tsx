"use client";

import { useEffect, useState } from 'react';
import {
  ProjectStore,
  type Project,
  type Task,
  type TaskStatus,
  type TaskImage,
  type Component,
  type PhaseId,
} from '../models/projects';
import { UsersStore, type User } from '../models/users';
import { RichTextEditor } from './RichTextEditor';
import { PhotoAnnotator } from './PhotoAnnotator';
import { BuildThreadView } from './BuildThreadView';
import { BuildComponentsPanel } from './BuildComponentsPanel';
import { BuildPhasesRail } from './BuildPhasesRail';
import { BuildJournalView } from './BuildJournalView';
import {
  apiGetProjects,
  apiGetTasksForProject,
  apiGetProjectWithTasks,
  apiCreateProject,
  apiCreateTask,
  apiUpdateTask,
  apiCreateVendor,
  apiDeleteVendor,
  apiCreateComponent,
  apiUpdateProject,
} from '../lib/api';

const STATUS_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'research', label: 'Research' },
  { id: 'ordering', label: 'Ordering' },
  { id: 'build', label: 'Build' },
  { id: 'approval', label: 'Approval' },
];

interface ProjectBoardProps {
  currentUser: User;
}

type TaskModalTab = 'notes' | 'resources' | 'photos';

type ProjectMainView = 'kanban' | 'thread' | 'journal';

export function ProjectBoard({ currentUser }: ProjectBoardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [phases, setPhases] = useState<import('../lib/api').ApiPhase[]>([]);
  const [activePhaseId, setActivePhaseId] = useState<PhaseId | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCostume, setNewProjectCostume] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [projectView, setProjectView] = useState<ProjectMainView>('kanban');
  const [selectedTaskDescription, setSelectedTaskDescription] = useState('');
  const [modalTab, setModalTab] = useState<TaskModalTab>('notes');
  const [annotatingImageId, setAnnotatingImageId] = useState<string | null>(null);

  const [vendorName, setVendorName] = useState('');
  const [vendorWebsite, setVendorWebsite] = useState('');
  const [vendorPart, setVendorPart] = useState('');
  const [vendorCost, setVendorCost] = useState('');
  const [vendorColor, setVendorColor] = useState('');

  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);
  const [loadingBackendProjects, setLoadingBackendProjects] = useState(false);
  const [loadingBackendTasks, setLoadingBackendTasks] = useState(false);
  const [useBackend, setUseBackend] = useState(false);

  useEffect(() => {
    if (useBackend) {
      // In backend mode, projects are loaded explicitly via the dev button.
      return;
    }
    const userProjects = ProjectStore.getProjectsForUser(currentUser.id);
    setProjects(userProjects);
    if (!activeProjectId && userProjects[0]) {
      setActiveProjectId(userProjects[0].id);
    }
  }, [currentUser.id, activeProjectId, useBackend]);

  useEffect(() => {
    if (!activeProjectId) {
      setTasks([]);
      setSelectedTask(null);
      setComponents([]);
      return;
    }
    if (useBackend) {
      // In backend mode we refresh tasks and components via API when switching builds.
      (async () => {
        try {
          setLoadingBackendTasks(true);
          const { project: apiProject, tasks: apiTasks } = await apiGetProjectWithTasks(
            activeProjectId,
          );
          const mappedTasks: Task[] = apiTasks.map((t) => ({
            id: t.id,
            projectId: t.projectId,
            title: t.title,
            descriptionHtml: t.descriptionHtml ?? undefined,
            status: t.status as TaskStatus,
            hours: t.hours ?? undefined,
            includeInThread: t.includeInThread,
            vendors: (t.vendors || []).map((v) => ({
              id: v.id,
              name: v.name,
              website: v.website ?? undefined,
              part: v.part ?? undefined,
              cost: v.cost ?? undefined,
              color: v.color ?? undefined,
              notesHtml: v.notesHtml ?? undefined,
            })),
            images: (t.images || []).map((img) => ({
              id: img.id,
              dataUrl: img.originalUrl,
              annotatedDataUrl: img.annotatedUrl ?? undefined,
              caption: img.caption ?? undefined,
            })),
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          }));
          setTasks(mappedTasks);

          // Map backend phases and components into local models
          setPhases(apiProject.phases || []);

          const mappedComponents: Component[] = (apiProject.components || []).map((c) => ({
            id: c.id,
            projectId: c.projectId,
            name: c.name,
            type: (c.type as any) || 'armor-piece',
            sourceType: (c.sourceType as any) || 'unknown',
            status: (c.status as any) || 'not-started',
          }));
          setComponents(mappedComponents);
        } catch {
          // ignore for now
        } finally {
          setLoadingBackendTasks(false);
        }
      })();
      return;
    }
    const projectTasks = ProjectStore.getTasksForProject(activeProjectId);
    setTasks(projectTasks);
  }, [activeProjectId, useBackend]);

  function refreshTasks(projectId: string, keepModal = true) {
    if (useBackend) {
      // In backend mode we expect the caller to have already updated tasks via API.
      return;
    }
    const projectTasks = ProjectStore.getTasksForProject(projectId);
    setTasks(projectTasks);
    if (keepModal && selectedTask) {
      const updated = projectTasks.find((t) => t.id === selectedTask.id) || null;
      setSelectedTask(updated);
      setSelectedTaskDescription(updated?.descriptionHtml || '');
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    if (useBackend) {
      try {
        const created = await apiCreateProject({
          name: newProjectName.trim(),
          costumeType: newProjectCostume.trim() || undefined,
          ownerId: currentUser.id,
          // Until we have real garrisons in backend, just fake with user id
          garrisonId: currentUser.id,
        });
        const mapped: Project = {
          id: created.id,
          ownerId: created.ownerId,
          name: created.name,
          costumeType: created.costumeType ?? undefined,
          members: [created.ownerId],
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
        setProjects((prev) => [mapped, ...prev]);
        setActiveProjectId(created.id);
      } catch {
        // ignore for now
      }
    } else {
      const proj = ProjectStore.createProject(
        currentUser.id,
        newProjectName.trim(),
        newProjectCostume.trim(),
      );
      const userProjects = ProjectStore.getProjectsForUser(currentUser.id);
      setProjects(userProjects);
      setActiveProjectId(proj.id);
    }

    setNewProjectName('');
    setNewProjectCostume('');
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProjectId || !newTaskTitle.trim()) return;

    if (useBackend) {
      try {
        const created = await apiCreateTask(activeProjectId, newTaskTitle.trim(), {
          phaseId: activePhaseId || undefined,
        });
        const mapped: Task = {
          id: created.id,
          projectId: created.projectId,
          title: created.title,
          descriptionHtml: created.descriptionHtml ?? undefined,
          status: created.status as TaskStatus,
          hours: created.hours ?? undefined,
          includeInThread: created.includeInThread,
          vendors: (created.vendors || []).map((v) => ({
            id: v.id,
            name: v.name,
            website: v.website ?? undefined,
            part: v.part ?? undefined,
            cost: v.cost ?? undefined,
            color: v.color ?? undefined,
            notesHtml: v.notesHtml ?? undefined,
          })),
          images: [],
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
        setTasks((prev) => [mapped, ...prev]);
      } catch {
        // ignore for now
      }
    } else {
      ProjectStore.createTask(activeProjectId, newTaskTitle.trim());
      refreshTasks(activeProjectId, false);
    }

    setNewTaskTitle('');
  }

  async function handleChangeStatus(task: Task, status: TaskStatus) {
    if (task.status === status) return;

    if (useBackend) {
      try {
        const updated = await apiUpdateTask(task.id, { status });
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: updated.status as TaskStatus,
                  updatedAt: updated.updatedAt,
                }
              : t,
          ),
        );
      } catch {
        // ignore
      }
    } else {
      ProjectStore.updateTask(task.id, { status });
      refreshTasks(task.projectId, false);
    }
  }

  function handleSelectTask(task: Task) {
    setSelectedTask(task);
    setSelectedTaskDescription(task.descriptionHtml || '');
    setModalTab('notes');
  }

  function clearModalState() {
    setSelectedTask(null);
    setSelectedTaskDescription('');
    setVendorName('');
    setVendorWebsite('');
    setVendorPart('');
    setVendorCost('');
    setVendorColor('');
    setPhotoFiles(null);
  }

  async function handleSaveNotes() {
    if (!selectedTask) return;

    if (useBackend) {
      try {
        const updated = await apiUpdateTask(selectedTask.id, {
          descriptionHtml: selectedTaskDescription,
        });
        setTasks((prev) =>
          prev.map((t) =>
            t.id === selectedTask.id
              ? {
                  ...t,
                  descriptionHtml: updated.descriptionHtml ?? undefined,
                  updatedAt: updated.updatedAt,
                }
              : t,
          ),
        );
      } catch {
        // ignore
      }
    } else {
      ProjectStore.updateTask(selectedTask.id, {
        descriptionHtml: selectedTaskDescription,
      });
      refreshTasks(selectedTask.projectId);
    }
  }

  async function handleAddVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTask || !vendorName.trim()) return;

    const costValue = vendorCost.trim() ? Number(vendorCost) : undefined;

    if (useBackend) {
      try {
        const created = await apiCreateVendor(selectedTask.id, {
          name: vendorName.trim(),
          website: vendorWebsite.trim() || undefined,
          part: vendorPart.trim() || undefined,
          cost: Number.isFinite(costValue || NaN) ? costValue : undefined,
          color: vendorColor.trim() || undefined,
          notesHtml: undefined,
        });
        setTasks((prev) =>
          prev.map((t) =>
            t.id === selectedTask.id
              ? {
                  ...t,
                  vendors: [
                    ...(t.vendors || []),
                    {
                      id: created.id,
                      name: created.name,
                      website: created.website ?? undefined,
                      part: created.part ?? undefined,
                      cost: created.cost ?? undefined,
                      color: created.color ?? undefined,
                      notesHtml: created.notesHtml ?? undefined,
                    },
                  ],
                }
              : t,
          ),
        );
      } catch {
        // ignore
      }
    } else {
      const newVendor = {
        id: crypto.randomUUID(),
        name: vendorName.trim(),
        website: vendorWebsite.trim() || undefined,
        part: vendorPart.trim() || undefined,
        cost: Number.isFinite(costValue || NaN) ? costValue : undefined,
        color: vendorColor.trim() || undefined,
        notesHtml: undefined,
      };

      ProjectStore.updateTask(selectedTask.id, {
        vendors: [...(selectedTask.vendors || []), newVendor],
      });
      refreshTasks(selectedTask.projectId);
    }

    setVendorName('');
    setVendorWebsite('');
    setVendorPart('');
    setVendorCost('');
    setVendorColor('');
  }

  async function handleRemoveVendor(id: string) {
    if (!selectedTask) return;

    if (useBackend) {
      try {
        await apiDeleteVendor(id);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === selectedTask.id
              ? {
                  ...t,
                  vendors: (t.vendors || []).filter((v) => v.id !== id),
                }
              : t,
          ),
        );
      } catch {
        // ignore
      }
    } else {
      ProjectStore.updateTask(selectedTask.id, {
        vendors: selectedTask.vendors.filter((v) => v.id !== id),
      });
      refreshTasks(selectedTask.projectId);
    }
  }

  function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedTask) return;
    const files = e.target.files;
    if (!files || !files.length) return;

    const fileArray = Array.from(files);
    const readers = fileArray.map(
      (file) =>
        new Promise<TaskImage>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async () => {
            const dataUrl = reader.result as string;

            if (useBackend) {
              try {
                const created = await apiCreateImage(selectedTask.id, { dataUrl });
                resolve({
                  id: created.id,
                  dataUrl: created.originalUrl,
                  annotatedDataUrl: created.annotatedUrl ?? undefined,
                  caption: created.caption ?? undefined,
                });
              } catch (err) {
                reject(err as any);
              }
            } else {
              resolve({
                id: crypto.randomUUID(),
                dataUrl,
              });
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }),
    );

    Promise.all(readers)
      .then((images) => {
        if (useBackend) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === selectedTask.id
                ? {
                    ...t,
                    images: [...(t.images || []), ...images],
                  }
                : t,
            ),
          );
        } else {
          ProjectStore.updateTask(selectedTask.id, {
            images: [...(selectedTask.images || []), ...images],
          });
          refreshTasks(selectedTask.projectId);
        }
      })
      .catch(() => {
        // ignore for now
      });
  }

  async function handleRemoveImage(id: string) {
    if (!selectedTask) return;

    if (useBackend) {
      try {
        await apiDeleteImage(id);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === selectedTask.id
              ? {
                  ...t,
                  images: (t.images || []).filter((img) => img.id !== id),
                }
              : t,
          ),
        );
      } catch {
        // ignore
      }
    } else {
      ProjectStore.updateTask(selectedTask.id, {
        images: selectedTask.images.filter((img) => img.id !== id),
      });
      refreshTasks(selectedTask.projectId);
    }
  }

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  const allUsers = UsersStore.getAll();
  const membersIds = activeProject?.members ?? [];
  const projectMembers: User[] = activeProject
    ? allUsers.filter((u) => membersIds.includes(u.id))
    : [];
  const otherUsers: User[] = activeProject
    ? allUsers.filter((u) => !membersIds.includes(u.id))
    : [];

  const annotatingImage = selectedTask && annotatingImageId
    ? selectedTask.images.find((img) => img.id === annotatingImageId) || null
    : null;

  async function handleAddComponent(name: string) {
    if (!activeProject || !useBackend) return;
    try {
      const created = await apiCreateComponent(activeProject.id, {
        name,
        type: 'armor-piece',
        sourceType: 'unknown',
      });
      const newComp: Component = {
        id: created.id,
        projectId: created.projectId,
        name: created.name,
        type: (created.type as any) || 'armor-piece',
        sourceType: (created.sourceType as any) || 'unknown',
        status: (created.status as any) || 'not-started',
      };
      setComponents((prev) => [...prev, newComp]);
    } catch {
      // ignore for now
    }
  }

  return (
    <section className="flex flex-col gap-4">
      {annotatingImage && selectedTask && (
        <PhotoAnnotator
          imageDataUrl={annotatingImage.dataUrl}
          initialAnnotatedDataUrl={annotatingImage.annotatedDataUrl}
          onCancel={() => setAnnotatingImageId(null)}
          onSave={async (annotatedUrl) => {
            const updatedImages = selectedTask.images.map((img) =>
              img.id === annotatingImage.id ? { ...img, annotatedDataUrl: annotatedUrl } : img,
            );

            if (useBackend) {
              // Persist annotated version for this image
              await apiUpdateImage(annotatingImage.id, { annotatedDataUrl: annotatedUrl });
              setTasks((prev) =>
                prev.map((t) =>
                  t.id === selectedTask.id
                    ? {
                        ...t,
                        images: updatedImages,
                      }
                    : t,
                ),
              );
            } else {
              ProjectStore.updateTask(selectedTask.id, { images: updatedImages });
              refreshTasks(selectedTask.projectId);
            }

            setAnnotatingImageId(null);
          }}
        />
      )}

      <div className="card-surface p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-2 text-[11px]">
            <button
              type="button"
              className={`px-2 py-1 rounded-md border transition-colors ${
                projectView === 'kanban'
                  ? 'border-imperial-red bg-imperial-red/20 text-slate-100'
                  : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-imperial-red'
              }`}
              onClick={() => setProjectView('kanban')}
            >
              Kanban
            </button>
            <button
              type="button"
              className={`px-2 py-1 rounded-md border transition-colors ${
                projectView === 'journal'
                  ? 'border-imperial-red bg-imperial-red/20 text-slate-100'
                  : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-imperial-red'
              }`}
              onClick={() => setProjectView('journal')}
            >
              Journal
            </button>
            <button
              type="button"
              className={`px-2 py-1 rounded-md border transition-colors ${
                projectView === 'thread'
                  ? 'border-imperial-red bg-imperial-red/20 text-slate-100'
                  : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-imperial-red'
              }`}
              onClick={() => setProjectView('thread')}
            >
              Build Thread
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">Builds</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Create a build for each costume and track work across research, sourcing,
              fabrication, fitting, and approval.
            </p>
          </div>

          <form onSubmit={handleCreateProject} className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1">
              <label className="label">Project Name</label>
              <input
                className="input-field min-w-[180px]"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. ANH Stunt TK"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label">Costume Type</label>
              <input
                className="input-field min-w-[160px]"
                value={newProjectCostume}
                onChange={(e) => setNewProjectCostume(e.target.value)}
                placeholder="TK, TI, TB, etc."
              />
            </div>
            <button type="submit" className="btn-secondary mt-1">
              New Project
            </button>
          </form>
        </div>

        {activeProject && useBackend && (
          <>
            <BuildPhasesRail
              phases={phases}
              activePhaseId={activePhaseId}
              onSelectPhase={setActivePhaseId}
            />
            <BuildComponentsPanel components={components} onAddComponent={handleAddComponent} />
          </>
        )}

        <div className="mt-3 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-400">Your Builds</p>
            <button
              type="button"
              className="text-[10px] text-slate-500 hover:text-imperial-red"
              onClick={async () => {
                try {
                  setLoadingBackendProjects(true);
                  const apiProjects = await apiGetProjects();
                  const mapped: Project[] = apiProjects.map((p) => ({
                    id: p.id,
                    ownerId: p.ownerId,
                    name: p.name,
                    costumeType: p.costumeType ?? undefined,
                    status: (p.status as any) || 'active',
                    members: [p.ownerId],
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt,
                  }));
                  setProjects(mapped);
                  if (mapped[0]) {
                    setActiveProjectId(mapped[0].id);
                  }
                  setUseBackend(true);
                } catch {
                  // ignore for now; in a real app show a toast
                } finally {
                  setLoadingBackendProjects(false);
                }
              }}
              disabled={loadingBackendProjects}
            >
              {loadingBackendProjects ? 'Loading from backend…' : 'Load from backend (dev)'}
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="text-[11px] text-slate-500">No builds yet. Create your first build above.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {projects.map((p) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveProjectId(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveProjectId(p.id);
                    }
                  }}
                  className={`cursor-pointer text-left border rounded-md px-3 py-2 bg-slate-900/70 hover:border-imperial-red/70 transition-colors ${
                    p.id === activeProjectId ? 'border-imperial-red' : 'border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[12px] font-semibold text-slate-100 truncate">
                        {p.name}
                      </div>
                      {p.costumeType && (
                        <div className="text-[10px] text-slate-400">{p.costumeType}</div>
                      )}
                    </div>
                    <span
                      className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${
                        p.status === 'closed'
                          ? 'border-slate-600 text-slate-400'
                          : 'border-emerald-500 text-emerald-400'
                      }`}
                    >
                      {p.status === 'closed' ? 'Closed' : 'Active'}
                    </span>
                    {p.id === activeProjectId && (
                      <span className="text-[9px] uppercase tracking-wide text-imperial-red">
                        Viewing
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between gap-2">
                    <span>Created {new Date(p.createdAt).toLocaleDateString()}</span>
                    {p.status === 'active' && (
                      <button
                        type="button"
                        className="text-[10px] text-slate-500 hover:text-red-400"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            if (useBackend) {
                              await apiUpdateProject(p.id, { status: 'closed' });
                              setProjects((prev) =>
                                prev.map((proj) =>
                                  proj.id === p.id ? { ...proj, status: 'closed' } : proj,
                                ),
                              );
                            } else {
                              ProjectStore.updateProjectStatus(p.id, 'closed');
                              setProjects((prev) =>
                                prev.map((proj) =>
                                  proj.id === p.id ? { ...proj, status: 'closed' } : proj,
                                ),
                              );
                            }
                          } catch {
                            // ignore for now
                          }
                        }}
                      >
                        Close Build
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeProject && projectView === 'kanban' && (
        <div className="card-surface p-3 sm:p-4 overflow-x-auto">
          {currentUser.id === activeProject.ownerId && (
            <div className="mb-4 border border-slate-800 rounded-md p-2 sm:p-3 flex flex-col gap-2 text-xs text-slate-300">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                    Collaborators on this Project
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    The owner of <span className="font-semibold text-slate-200">{activeProject.name}</span> can
                    invite other members on this device to work on this build. Access applies only
                    to this project. This is a local preview; real invites will require a backend.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-end mt-1">
                <div className="flex flex-col gap-1 min-w-[180px]">
                  <label className="label">Add Member</label>
                  <select
                    className="input-field bg-bg-softer/90 text-[11px]"
                    value=""
                    onChange={(e) => {
                      const userId = e.target.value;
                      if (!userId) return;
                      if (!activeProject) return;
                      ProjectStore.addMember(activeProject.id, userId);
                      const userProjects = ProjectStore.getProjectsForUser(currentUser.id);
                      setProjects(userProjects);
                    }}
                  >
                    <option value="">Select user…</option>
                    {otherUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName || u.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {projectMembers.length === 0 ? (
                  <p className="text-[11px] text-slate-500">
                    Only the owner is currently listed on this project.
                  </p>
                ) : (
                  projectMembers.map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5 text-[11px] bg-slate-900/70"
                    >
                      {u.displayName || u.email}
                      {u.id !== activeProject.ownerId && (
                        <button
                          type="button"
                          onClick={() => {
                            ProjectStore.removeMember(activeProject.id, u.id);
                            const userProjects = ProjectStore.getProjectsForUser(currentUser.id);
                            setProjects(userProjects);
                          }}
                          className="text-[10px] text-slate-400 hover:text-red-300 ml-1"
                        >
                          ✕
                        </button>
                      )}
                      {u.id === activeProject.ownerId && (
                        <span className="text-[9px] uppercase tracking-wide text-imperial-red ml-1">
                          Owner
                        </span>
                      )}
                    </span>
                  ))
                )}
              </div>
            </div>
          )}
          <div className="flex items-end justify-between gap-3 mb-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Tasks for {activeProject.name}
              </h3>
              <p className="text-[11px] text-slate-500">
                These cards represent individual steps for this build (e.g. order boots, build chest
                plate). Click a card to open detailed notes, vendors, and photos.
              </p>
            </div>
            <form onSubmit={handleCreateTask} className="flex flex-wrap gap-2 items-end">
              <div className="flex flex-col gap-1">
                <label className="label">New Task</label>
                <input
                  className="input-field min-w-[180px]"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Order armor kit, Research helmet paint"
                  required
                />
              </div>
              <button type="submit" className="btn-secondary mt-1">
                Add
              </button>
            </form>
          </div>

          <div className="flex items-center justify-end gap-2 mb-2 text-[10px] text-slate-500">
            <button
              type="button"
              className="text-[10px] text-slate-500 hover:text-imperial-red"
              onClick={async () => {
                if (!activeProject) return;
                try {
                  setLoadingBackendTasks(true);
                  const apiTasks = await apiGetTasksForProject(activeProject.id);
                  const mappedTasks: Task[] = apiTasks.map((t) => ({
                    id: t.id,
                    projectId: t.projectId,
                    title: t.title,
                    descriptionHtml: t.descriptionHtml ?? undefined,
                    status: t.status as TaskStatus,
                    hours: t.hours ?? undefined,
                    includeInThread: t.includeInThread,
                    vendors: (t.vendors || []).map((v) => ({
                      id: v.id,
                      name: v.name,
                      website: v.website ?? undefined,
                      part: v.part ?? undefined,
                      cost: v.cost ?? undefined,
                      color: v.color ?? undefined,
                      notesHtml: v.notesHtml ?? undefined,
                    })),
                    images: (t.images || []).map((img) => ({
                      id: img.id,
                      dataUrl: img.originalUrl,
                      annotatedDataUrl: img.annotatedUrl ?? undefined,
                      caption: img.caption ?? undefined,
                    })),
                    createdAt: t.createdAt,
                    updatedAt: t.updatedAt,
                  }));
                  setTasks(mappedTasks);
                } catch {
                  // ignore for now
                } finally {
                  setLoadingBackendTasks(false);
                }
              }}
              disabled={loadingBackendTasks}
            >
              {loadingBackendTasks ? 'Loading tasks from backend…' : 'Load tasks from backend (dev)'}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {STATUS_COLUMNS.map((col) => (
              <div key={col.id} className="bg-slate-900/60 border border-slate-800 rounded-lg p-2 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                    {col.label}
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    {tasks.filter((t) =>
                      activePhaseId ? t.status === col.id && t.phaseId === activePhaseId : t.status === col.id,
                    ).length}{' '}
                    items
                  </span>
                </div>
                <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
                  {tasks
                    .filter((t) =>
                      activePhaseId ? t.status === col.id && t.phaseId === activePhaseId : t.status === col.id,
                    )
                    .map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => handleSelectTask(task)}
                        className={`text-left rounded-md border px-2 py-1.5 text-xs bg-slate-900/80 hover:border-imperial-red/70 hover:bg-slate-800/90 transition-colors ${
                          selectedTask?.id === task.id ? 'border-imperial-red' : 'border-slate-700'
                        }`}
                      >
                        <div className="font-semibold text-slate-100 mb-0.5 truncate">
                          {task.title}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">
                          {task.descriptionHtml
                            ? 'Notes added'
                            : 'No notes yet – click to add build details and vendor info.'}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1 text-[9px] text-slate-500">
                          <span>{task.vendors.length} vendors</span>
                          <span>{task.images?.length ?? 0} photos</span>
                          {task.componentId && (
                            <span className="px-1.5 py-0.5 rounded-full border border-slate-700 text-slate-300">
                              {components.find((c) => c.id === task.componentId)?.name || 'Component'}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1 text-[9px] text-slate-500">
                          {STATUS_COLUMNS.map((s) => (
                            <span
                              key={s.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChangeStatus(task, s.id);
                              }}
                              className={`px-1.5 py-0.5 rounded-full border transition-colors cursor-pointer select-none ${
                                task.status === s.id
                                  ? 'border-imperial-red bg-imperial-red/30 text-slate-50'
                                  : 'border-slate-700 text-slate-400 hover:border-imperial-red'
                              }`}
                            >
                              {s.label[0]}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeProject && projectView === 'journal' && (
        <BuildJournalView
          tasks={tasks}
          phases={phases}
          components={components}
          onSelectTask={handleSelectTask}
        />
      )}

      {activeProject && projectView === 'thread' && (
        <BuildThreadView
          project={activeProject}
          tasks={tasks}
          owner={UsersStore.getById ? (UsersStore as any).getById?.(activeProject.ownerId) ?? null : null}
        />
      )}

      {selectedTask && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-3xl card-surface p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={clearModalState}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-100 text-xs"
            >
              Close
            </button>

            <h3 className="text-sm font-semibold text-slate-100 mb-1">{selectedTask.title}</h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Created {new Date(selectedTask.createdAt).toLocaleString()} • Status: {selectedTask.status}
            </p>

            <div className="border-b border-slate-800 mb-3 flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setModalTab('notes')}
                className={`px-3 py-2 border-b-2 transition-colors ${
                  modalTab === 'notes'
                    ? 'border-imperial-red text-slate-100'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Notes
              </button>
              <button
                type="button"
                onClick={() => setModalTab('resources')}
                className={`px-3 py-2 border-b-2 transition-colors ${
                  modalTab === 'resources'
                    ? 'border-imperial-red text-slate-100'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Resources
              </button>
              <button
                type="button"
                onClick={() => setModalTab('photos')}
                className={`px-3 py-2 border-b-2 transition-colors ${
                  modalTab === 'photos'
                    ? 'border-imperial-red text-slate-100'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Photos
              </button>
            </div>

            {modalTab === 'notes' && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400">
                  Use the rich text editor to capture build steps, CRL references, measurements, and
                  decisions for this task.
                </p>

                {useBackend && components.length > 0 && (
                  <div className="flex flex-col gap-1 text-[11px] text-slate-300">
                    <label className="label">Component</label>
                    <select
                      className="input-field bg-slate-900/70 text-[11px] py-1.5"
                      value={selectedTask.componentId || ''}
                      onChange={async (e) => {
                        const newId = e.target.value || null;
                        if (!selectedTask) return;
                        if (useBackend) {
                          try {
                            const updated = await apiUpdateTask(selectedTask.id, {
                              componentId: newId,
                            } as any);
                            setTasks((prev) =>
                              prev.map((t) =>
                                t.id === selectedTask.id
                                  ? { ...t, componentId: updated.componentId || undefined }
                                  : t,
                              ),
                            );
                            setSelectedTask((prev) =>
                              prev && prev.id === selectedTask.id
                                ? { ...prev, componentId: updated.componentId || undefined }
                                : prev,
                            );
                          } catch {
                            // ignore
                          }
                        }
                      }}
                    >
                      <option value="">No specific component</option>
                      {components.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <label className="flex items-center gap-2 text-[11px] text-slate-400">
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-slate-700 bg-slate-900"
                    checked={selectedTask.includeInThread !== false}
                    onChange={async (e) => {
                      if (!selectedTask) return;
                      const include = e.target.checked;
                      if (useBackend) {
                        try {
                          const updated = await apiUpdateTask(selectedTask.id, {
                            includeInThread: include,
                          });
                          setTasks((prev) =>
                            prev.map((t) =>
                              t.id === selectedTask.id
                                ? { ...t, includeInThread: updated.includeInThread }
                                : t,
                            ),
                          );
                        } catch {
                          // ignore
                        }
                      } else {
                        ProjectStore.updateTask(selectedTask.id, {
                          includeInThread: include,
                        });
                        refreshTasks(selectedTask.projectId, false);
                      }
                    }}
                  />
                  <span>Include this task in exported build thread</span>
                </label>
                <RichTextEditor
                  value={selectedTaskDescription}
                  onChange={setSelectedTaskDescription}
                  placeholder="Add detailed build notes, links, and references for this step."
                />
                <button
                  type="button"
                  className="btn-primary mt-2 self-start"
                  onClick={handleSaveNotes}
                >
                  Save Notes
                </button>
              </div>
            )}

            {modalTab === 'resources' && (
              <div className="space-y-3 text-xs text-slate-300">
                <form
                  onSubmit={handleAddVendor}
                  className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 items-end"
                >
                  <div className="flex flex-col gap-1">
                    <label className="label">Vendor Name</label>
                    <input
                      className="input-field"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      placeholder="e.g. Armor Maker"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="label">Website</label>
                    <input
                      className="input-field"
                      value={vendorWebsite}
                      onChange={(e) => setVendorWebsite(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="label">Part / Item</label>
                    <input
                      className="input-field"
                      value={vendorPart}
                      onChange={(e) => setVendorPart(e.target.value)}
                      placeholder="e.g. Helmet, Belt, Boots"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="label">Cost</label>
                    <input
                      className="input-field"
                      value={vendorCost}
                      onChange={(e) => setVendorCost(e.target.value)}
                      placeholder="e.g. 250.00"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="label">Color / Variant</label>
                    <input
                      className="input-field"
                      value={vendorColor}
                      onChange={(e) => setVendorColor(e.target.value)}
                      placeholder="e.g. Gloss White, Black Series"
                    />
                  </div>
                  <button type="submit" className="btn-secondary mt-2">
                    Add Resource
                  </button>
                </form>

                <div className="mt-2 border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-[11px] text-slate-300">
                    <thead className="bg-slate-900/80 text-slate-400">
                      <tr>
                        <th className="px-2 py-1 text-left">Vendor</th>
                        <th className="px-2 py-1 text-left">Item</th>
                        <th className="px-2 py-1 text-right">Cost</th>
                        <th className="px-2 py-1 text-left">Color</th>
                        <th className="px-2 py-1 text-left">Website</th>
                        <th className="px-2 py-1 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTask.vendors.length === 0 ? (
                        <tr>
                          <td
                            className="px-2 py-2 text-center text-slate-500"
                            colSpan={6}
                          >
                            No vendor resources yet. Use the form above to add one.
                          </td>
                        </tr>
                      ) : (
                        selectedTask.vendors.map((v) => (
                          <tr key={v.id} className="border-t border-slate-800">
                            <td className="px-2 py-1">{v.name}</td>
                            <td className="px-2 py-1">{v.part ?? '-'}</td>
                            <td className="px-2 py-1 text-right">
                              {typeof v.cost === 'number' ? v.cost.toFixed(2) : '-'}
                            </td>
                            <td className="px-2 py-1">{v.color ?? '-'}</td>
                            <td className="px-2 py-1 max-w-[140px] truncate">
                              {v.website ? (
                                <a
                                  href={v.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-imperial-red hover:underline"
                                >
                                  {v.website}
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="px-2 py-1 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveVendor(v.id)}
                                className="text-[10px] text-slate-400 hover:text-red-300"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {modalTab === 'photos' && (
              <div className="space-y-3 text-xs text-slate-300">
                <p className="text-[11px] text-slate-400">
                  Upload reference and progress photos for this task. Use Annotate to draw directly
                  on the image.
                </p>
                <div className="flex flex-col gap-2">
                  <label className="label">Add Photos</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddPhotos}
                    className="text-[11px] text-slate-300"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {(selectedTask.images || []).map((img) => (
                    <div
                      key={img.id}
                      className="relative border border-slate-700 rounded-md overflow-hidden bg-slate-900/70 flex flex-col"
                    >
                      <div className="relative">
                        <img
                          src={img.annotatedDataUrl || img.dataUrl}
                          alt="Task"
                          className="w-full h-32 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="absolute top-1 right-1 text-[10px] bg-black/60 rounded-full px-1 text-slate-200 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex gap-1 p-1 border-t border-slate-800 bg-slate-950/60 justify-between items-center">
                        <button
                          type="button"
                          className="text-[10px] text-imperial-red hover:underline"
                          onClick={() => setAnnotatingImageId(img.id)}
                        >
                          Annotate
                        </button>
                        {img.annotatedDataUrl && (
                          <span className="text-[9px] text-emerald-400">Annotated</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedTask.images.length === 0 && (
                    <p className="text-[11px] text-slate-500 col-span-full">
                      No photos yet. Use the file selector above to upload reference or progress
                      shots.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}