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
import { ResourceLibraryStore } from '../models/resourceLibrary';
import { ProjectChecklistStore, type ChecklistArea, type ChecklistStatus } from '../models/projectChecklists';
import { CrlTemplateStore } from '../models/crlTemplates';
import { getCrlForCostumeType } from '../lib/crlConfig';
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
  startNewBuild?: boolean;
  selectedProjectId?: string | null;
  onNewBuildHandled?: () => void;
}

type TaskModalTab = 'notes' | 'resources' | 'photos';

type ProjectMainView = 'kanban' | 'thread' | 'journal';

export function ProjectBoard({ currentUser, startNewBuild, selectedProjectId, onNewBuildHandled }: ProjectBoardProps) {
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
  const [annotatingChecklistImageId, setAnnotatingChecklistImageId] = useState<string | null>(null);

  const [vendorName, setVendorName] = useState('');
  const [vendorWebsite, setVendorWebsite] = useState('');
  const [vendorPart, setVendorPart] = useState('');
  const [vendorCost, setVendorCost] = useState('');
  const [vendorColor, setVendorColor] = useState('');
  const [showResourcesModal, setShowResourcesModal] = useState(false);

  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectCrlUrl, setNewProjectCrlUrl] = useState('');
  const [loadingBackendProjects, setLoadingBackendProjects] = useState(false);
  const [loadingBackendTasks, setLoadingBackendTasks] = useState(false);
  const [useBackend, setUseBackend] = useState(false);
  const [crlStatuses, setCrlStatuses] = useState<Record<string, 'planned' | 'in-progress' | 'done'>>({});
  const [checklistAreas, setChecklistAreas] = useState<ChecklistArea[]>([]);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemAreaId, setNewItemAreaId] = useState<string>('');
  const [availableAreas, setAvailableAreas] = useState(CrlTemplateStore.getAreas());

  const [activeChecklistAreaId, setActiveChecklistAreaId] = useState<string | null>(null);
  const [activeChecklistItemId, setActiveChecklistItemId] = useState<string | null>(null);
  const [checklistBuilderNotes, setChecklistBuilderNotes] = useState('');
  const [checklistGmlNotes, setChecklistGmlNotes] = useState('');
  const [checklistImages, setChecklistImages] = useState<ChecklistArea[0]['items'][0]['images'] | undefined>(
    undefined,
  );
  const [showChecklistItemModal, setShowChecklistItemModal] = useState(false);
  const [showChecklistFullEditor, setShowChecklistFullEditor] = useState(false);
  const [checklistFullEditorTarget, setChecklistFullEditorTarget] =
    useState<'builder' | 'gml' | null>(null);
  const [checklistFullEditorValue, setChecklistFullEditorValue] = useState('');

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

  useEffect(() => {
    if (startNewBuild) {
      setShowNewProjectModal(true);
      onNewBuildHandled?.();
    }
  }, [startNewBuild, onNewBuildHandled]);

  // When coming from Overview, select the requested project
  useEffect(() => {
    if (!selectedProjectId) return;
    setActiveProjectId(selectedProjectId);
  }, [selectedProjectId]);

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    if (useBackend) {
      try {
        const created = await apiCreateProject({
          name: newProjectName.trim(),
          costumeType: newProjectCostume.trim() || undefined,
          crlUrl: newProjectCrlUrl.trim() || undefined,
          ownerId: currentUser.id,
          // Until we have real garrisons in backend, just fake with user id
          garrisonId: currentUser.id,
        });
        const mapped: Project = {
          id: created.id,
          ownerId: created.ownerId,
          name: created.name,
          costumeType: created.costumeType ?? undefined,
          crlUrl: (created as any).crlUrl ?? undefined,
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
        newProjectCrlUrl.trim() || undefined,
      );
      const userProjects = ProjectStore.getProjectsForUser(currentUser.id);
      setProjects(userProjects);
      setActiveProjectId(proj.id);
    }

    setNewProjectName('');
    setNewProjectCostume('');
    setNewProjectCrlUrl('');
    setShowNewProjectModal(false);
    onNewBuildHandled?.();
  }

  async function handleCreateProjectFromModal(e: React.FormEvent) {
    await handleCreateProject(e);
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
    if (!vendorName.trim()) return;

    const activeProject = projects.find((p) => p.id === activeProjectId) || null;
    const targetTask =
      selectedTask ||
      (activeProject
        ? tasks.find((t) => t.projectId === activeProject.id) || null
        : null);

    if (!targetTask) return;

    const costValue = vendorCost.trim() ? Number(vendorCost) : undefined;

    // Log into global resource library for future builds
    ResourceLibraryStore.add({
      name: vendorName.trim(),
      item: vendorPart.trim() || vendorName.trim(),
      cost: Number.isFinite(costValue || NaN) ? costValue : undefined,
      website: vendorWebsite.trim() || undefined,
      notes: undefined,
      costumeTypeUsed: activeProject?.costumeType,
      projectIdUsed: targetTask.projectId,
    });

    if (useBackend) {
      try {
        const created = await apiCreateVendor(targetTask.id, {
          name: vendorName.trim(),
          website: vendorWebsite.trim() || undefined,
          part: vendorPart.trim() || undefined,
          cost: Number.isFinite(costValue || NaN) ? costValue : undefined,
          color: vendorColor.trim() || undefined,
          notesHtml: undefined,
        });
        setTasks((prev) =>
          prev.map((t) =>
            t.id === targetTask.id
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

      ProjectStore.updateTask(targetTask.id, {
        vendors: [...(targetTask.vendors || []), newVendor],
      });
      refreshTasks(targetTask.projectId);
    }

    setVendorName('');
    setVendorWebsite('');
    setVendorPart('');
    setVendorCost('');
    setVendorColor('');
  }

  async function handleRemoveVendor(id: string) {
    // Find which task owns this vendor
    const owningTask = tasks.find((t) => (t.vendors || []).some((v) => v.id === id));
    if (!owningTask) return;

    if (useBackend) {
      try {
        await apiDeleteVendor(id);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === owningTask.id
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
      const updatedVendors = (owningTask.vendors || []).filter((v) => v.id !== id);
      ProjectStore.updateTask(owningTask.id, { vendors: updatedVendors });
      refreshTasks(owningTask.projectId);
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

  // Load per-project checklist when active project changes (front-end only)
  useEffect(() => {
    if (!activeProject) {
      setChecklistAreas([]);
      return;
    }
    const stored = ProjectChecklistStore.getForProject(activeProject.id);
    setChecklistAreas(stored.areas || []);
    setAvailableAreas(CrlTemplateStore.getAreas());
  }, [activeProject?.id]);

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

  const annotatingChecklistImage =
    showChecklistItemModal && annotatingChecklistImageId && checklistImages
      ? checklistImages.find((img) => img.id === annotatingChecklistImageId) || null
      : null;

  const totalTasks = tasks.length;
  const totalPhotos = tasks.reduce((sum, t) => sum + (t.images?.length || 0), 0);
  const totalVendors = tasks.reduce((sum, t) => sum + (t.vendors?.length || 0), 0);
  const totalChecklistItems = checklistAreas.reduce((sum, a) => sum + a.items.length, 0);
  const completedChecklistItems = checklistAreas.reduce(
    (sum, a) => sum + a.items.filter((i) => i.status === 'done').length,
    0,
  );
  const checklistCompletionPct = totalChecklistItems
    ? Math.round((completedChecklistItems / totalChecklistItems) * 100)
    : 0;

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

      {showChecklistFullEditor && checklistFullEditorTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-4xl card-surface p-4 sm:p-6 relative max-h-[95vh] overflow-y-auto text-xs">
            <button
              type="button"
              onClick={() => setShowChecklistFullEditor(false)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-100 text-xs"
            >
              Close
            </button>

            <h3 className="text-sm font-semibold text-slate-100 mb-1">
              {checklistFullEditorTarget === 'builder' ? 'Builder Notes' : 'GML Notes'} – Full Editor
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Use the larger editor to write detailed notes. When you save, they will appear back in
              the checklist panel.
            </p>

            <RichTextEditor
              value={checklistFullEditorValue}
              onChange={setChecklistFullEditorValue}
              size="lg"
              placeholder={
                checklistFullEditorTarget === 'builder'
                  ? 'Add build notes, fit considerations, weathering details, etc.'
                  : 'Add approval notes, CRL clarifications, and adjustments.'
              }
            />

            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowChecklistFullEditor(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (!checklistFullEditorTarget) return;
                  if (checklistFullEditorTarget === 'builder') {
                    setChecklistBuilderNotes(checklistFullEditorValue);
                  } else {
                    setChecklistGmlNotes(checklistFullEditorValue);
                  }
                  setShowChecklistFullEditor(false);
                }}
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {annotatingChecklistImage && (
        <PhotoAnnotator
          imageDataUrl={annotatingChecklistImage.dataUrl}
          initialAnnotatedDataUrl={annotatingChecklistImage.annotatedDataUrl}
          onCancel={() => setAnnotatingChecklistImageId(null)}
          onSave={(annotatedUrl) => {
            setChecklistImages((prev) => {
              const list = prev ?? [];
              return list.map((img) =>
                img.id === annotatingChecklistImage.id
                  ? { ...img, annotatedDataUrl: annotatedUrl }
                  : img,
              );
            });
            setAnnotatingChecklistImageId(null);
          }}
        />
      )}

      <div className="card-surface p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-[220px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Build Workspace
            </p>
            {activeProject ? (
              <>
                <h2 className="text-lg font-semibold text-slate-50 truncate">
                  {activeProject.name}
                </h2>
                <div className="text-[11px] text-slate-400 flex flex-col gap-0.5">
                  {activeProject.costumeType && (
                    <div>
                      <span className="font-semibold text-slate-200">Costume:</span>{' '}
                      <span>{activeProject.costumeType}</span>
                    </div>
                  )}
                  {(activeProject as any).crlUrl && (
                    <div>
                      <span className="font-semibold text-slate-200">CRL:</span>{' '}
                      <a
                        href={(activeProject as any).crlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-imperial-red hover:underline break-all"
                      >
                        {(activeProject as any).crlUrl}
                      </a>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-slate-200">No build selected</h2>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Create or select a build from the Overview page to start tracking tasks, checklist
                  items, and photos.
                </p>
              </>
            )}
          </div>

          {activeProject && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
              <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950/90 px-3 py-2 flex flex-col gap-0.5 shadow-[0_0_0_1px_rgba(15,23,42,0.8),0_18px_35px_rgba(0,0,0,0.6)]">
                <span className="text-[9px] uppercase tracking-[0.18em] text-slate-500">Tasks</span>
                <span className="text-lg font-semibold text-slate-50">{totalTasks}</span>
                <span className="text-[10px] text-slate-500">Steps across this build</span>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-bl from-imperial-red/15 to-transparent opacity-70" />
              </div>
              <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950/90 px-3 py-2 flex flex-col gap-0.5 shadow-[0_0_0_1px_rgba(15,23,42,0.8),0_18px_35px_rgba(0,0,0,0.6)]">
                <span className="text-[9px] uppercase tracking-[0.18em] text-slate-500">Photos</span>
                <span className="text-lg font-semibold text-slate-50">{totalPhotos}</span>
                <span className="text-[10px] text-slate-500">Reference & progress shots</span>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-bl from-sky-500/20 to-transparent opacity-70" />
              </div>
              <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950/90 px-3 py-2 flex flex-col gap-0.5 shadow-[0_0_0_1px_rgba(15,23,42,0.8),0_18px_35px_rgba(0,0,0,0.6)]">
                <span className="text-[9px] uppercase tracking-[0.18em] text-slate-500">Vendors</span>
                <span className="text-lg font-semibold text-slate-50">{totalVendors}</span>
                <span className="text-[10px] text-slate-500">Sources tied to this build</span>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-bl from-amber-500/20 to-transparent opacity-70" />
              </div>
              <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950/90 px-3 py-2 flex flex-col gap-0.5 shadow-[0_0_0_1px_rgba(15,23,42,0.8),0_18px_35px_rgba(0,0,0,0.6)]">
                <span className="text-[9px] uppercase tracking-[0.18em] text-slate-500">Checklist</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-slate-50">
                    {completedChecklistItems}
                  </span>
                  <span className="text-[10px] text-slate-500">/ {totalChecklistItems || 0}</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-900/80 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-300"
                    style={{ width: `${checklistCompletionPct}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500">
                  {checklistCompletionPct}% CRL coverage
                </span>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-bl from-emerald-500/20 to-transparent opacity-70" />
              </div>
            </div>
          )}

          <div className="flex gap-1 text-[11px] bg-slate-950/80 border border-slate-800 rounded-md px-1.5 py-1">
            <button
              type="button"
              className={`px-2 py-0.5 rounded-sm transition-colors ${
                projectView === 'kanban'
                  ? 'bg-imperial-red/80 text-slate-50'
                  : 'text-slate-300 hover:bg-slate-800/80'
              }`}
              onClick={() => setProjectView('kanban')}
            >
              Tasks
            </button>
            <button
              type="button"
              className={`px-2 py-0.5 rounded-sm transition-colors ${
                projectView === 'journal'
                  ? 'bg-imperial-red/80 text-slate-50'
                  : 'text-slate-300 hover:bg-slate-800/80'
              }`}
              onClick={() => setProjectView('journal')}
            >
              Journal
            </button>
            <button
              type="button"
              className={`px-2 py-0.5 rounded-sm transition-colors ${
                projectView === 'thread'
                  ? 'bg-imperial-red/80 text-slate-50'
                  : 'text-slate-300 hover:bg-slate-800/80'
              }`}
              onClick={() => setProjectView('thread')}
            >
              Build Thread
            </button>
          </div>
        </div>

        {activeProject && (
          <div className="mt-3 border-t border-slate-800/80 pt-3 flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                  CRL Checklist
                </h3>
                <p className="text-[11px] text-slate-500 max-w-xl">
                  Quick reference for required parts for this costume type. Track whether each item
                  is planned, in-progress, or done.
                </p>
              </div>
            </div>

            {/* Areas are now defined in Settings → CRL Checklists. */}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!activeProject) return;
                if (!newItemLabel.trim() || !newItemAreaId) return;

                const areaTemplate = availableAreas.find((a) => a.id === newItemAreaId);
                if (!areaTemplate) return;

                const targetArea =
                  checklistAreas.find((a) => a.id === newItemAreaId) ||
                  ({ id: newItemAreaId, name: areaTemplate.name, items: [] } as ChecklistArea);

                const updatedAreas: ChecklistArea[] = [
                  ...checklistAreas.filter((a) => a.id !== newItemAreaId),
                  {
                    ...targetArea,
                    name: areaTemplate.name,
                    items: [
                      ...targetArea.items,
                      {
                        id: crypto.randomUUID(),
                        label: newItemLabel.trim(),
                        status: 'planned' as ChecklistStatus,
                      },
                    ],
                  },
                ];
                setChecklistAreas(updatedAreas);
                ProjectChecklistStore.saveForProject(activeProject.id, updatedAreas);
                setNewItemLabel('');
              }}
              className="flex flex-wrap items-end gap-2 mt-2 text-[11px]"
            >
              <div className="flex flex-col gap-1">
                <label className="label">Area</label>
                <select
                  className="input-field min-w-[140px] bg-slate-900/70"
                  value={newItemAreaId}
                  onChange={(e) => setNewItemAreaId(e.target.value)}
                >
                  <option value="">Select area…</option>
                  {availableAreas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="label">New Item</label>
                <input
                  className="input-field min-w-[160px]"
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  placeholder="e.g. Helmet, Belt, Boots"
                />
              </div>
              <button type="submit" className="btn-secondary mt-1">
                Add Item
              </button>
            </form>

            <div className="border border-slate-800 rounded-md overflow-hidden mt-2">
              <div className="grid grid-cols-4 gap-1 px-2 py-1.5 text-[10px] bg-slate-950/80 text-slate-400">
                <span>Area</span>
                <span>Item</span>
                <span className="text-center">Status</span>
                <span className="text-right">Mark</span>
              </div>
              <div className="divide-y divide-slate-800 text-[11px] max-h-56 overflow-y-auto">
                {checklistAreas.length === 0 ? (
                  <div className="px-2 py-2 text-[11px] text-slate-500">
                    No checklist items yet. Add an area and item above.
                  </div>
                ) : (
                  checklistAreas.flatMap((area) =>
                    area.items.map((item) => {
                      const status = item.status as ChecklistStatus;
                      return (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          className="grid grid-cols-4 gap-1 px-2 py-1 items-center bg-slate-950/40 w-full text-left hover:bg-slate-900/80 cursor-pointer"
                          onClick={() => {
                            if (!activeProject) return;
                            setActiveChecklistAreaId(area.id);
                            setActiveChecklistItemId(item.id);
                            setChecklistBuilderNotes(item.builderNotesHtml || '');
                            setChecklistGmlNotes(item.gmlNotesHtml || '');
                            setChecklistImages(item.images || []);
                            setShowChecklistItemModal(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              if (!activeProject) return;
                              setActiveChecklistAreaId(area.id);
                              setActiveChecklistItemId(item.id);
                              setChecklistBuilderNotes(item.builderNotesHtml || '');
                              setChecklistGmlNotes(item.gmlNotesHtml || '');
                              setChecklistImages(item.images || []);
                              setShowChecklistItemModal(true);
                            }
                          }}
                        >
                          <div className="truncate text-slate-200">{area.name}</div>
                          <div className="truncate text-slate-100">{item.label}</div>
                          <div className="flex justify-center">
                            <span
                              className={
                                status === 'done'
                                  ? 'px-2 py-0.5 rounded-full bg-emerald-700/40 text-emerald-300 text-[10px]'
                                  : status === 'in-progress'
                                    ? 'px-2 py-0.5 rounded-full bg-amber-700/40 text-amber-300 text-[10px]'
                                    : 'px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]'
                              }
                            >
                              {status === 'done'
                                ? 'Done'
                                : status === 'in-progress'
                                  ? 'In Progress'
                                  : 'Planned'}
                            </span>
                          </div>
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!activeProject) return;
                                const updated = checklistAreas.map((a) =>
                                  a.id === area.id
                                    ? {
                                        ...a,
                                        items: a.items.map((it) =>
                                          it.id === item.id
                                            ? { ...it, status: 'planned' as ChecklistStatus }
                                            : it,
                                        ),
                                      }
                                    : a,
                                );
                                setChecklistAreas(updated);
                                ProjectChecklistStore.saveForProject(activeProject.id, updated);
                              }}
                              className={`px-1.5 py-0.5 rounded border text-[10px] ${
                                status === 'planned'
                                  ? 'border-slate-500 text-slate-200'
                                  : 'border-slate-700 text-slate-500 hover:text-slate-200'
                              }`}
                            >
                              P
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!activeProject) return;
                                const updated = checklistAreas.map((a) =>
                                  a.id === area.id
                                    ? {
                                        ...a,
                                        items: a.items.map((it) =>
                                          it.id === item.id
                                            ? { ...it, status: 'in-progress' as ChecklistStatus }
                                            : it,
                                        ),
                                      }
                                    : a,
                                );
                                setChecklistAreas(updated);
                                ProjectChecklistStore.saveForProject(activeProject.id, updated);
                              }}
                              className={`px-1.5 py-0.5 rounded border text-[10px] ${
                                status === 'in-progress'
                                  ? 'border-amber-500 text-amber-300'
                                  : 'border-slate-700 text-slate-500 hover:text-slate-200'
                              }`}
                            >
                              IP
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!activeProject) return;
                                const updated = checklistAreas.map((a) =>
                                  a.id === area.id
                                    ? {
                                        ...a,
                                        items: a.items.map((it) =>
                                          it.id === item.id
                                            ? { ...it, status: 'done' as ChecklistStatus }
                                            : it,
                                        ),
                                      }
                                    : a,
                                );
                                setChecklistAreas(updated);
                                ProjectChecklistStore.saveForProject(activeProject.id, updated);
                              }}
                              className={`px-1.5 py-0.5 rounded border text-[10px] ${
                                status === 'done'
                                  ? 'border-emerald-500 text-emerald-300'
                                  : 'border-slate-700 text-slate-500 hover:text-slate-200'
                              }`}
                            >
                              D
                            </button>
                          </div>
                        </div>
                      );
                    }),
                  )
                )}
              </div>
            </div>
          </div>
        )}

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
          <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Tasks for {activeProject.name}
              </h3>
              <p className="text-[11px] text-slate-500">
                These cards represent individual steps for this build (e.g. order boots, build chest
                plate). Click a card to open detailed notes, vendors, and photos.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <button
                type="button"
                onClick={() => setShowResourcesModal(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-950/70 px-3 py-1.5 text-[11px] text-slate-200 hover:border-amber-400/80 hover:bg-slate-900/80 hover:text-amber-100 transition-colors shadow-[0_0_0_1px_rgba(15,23,42,0.9),0_10px_25px_rgba(0,0,0,0.5)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_0_2px_rgba(250,204,21,0.4)]" />
                <span>Manage build resources</span>
              </button>
              <div className="w-px h-8 bg-slate-800/80" />
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

      {showNewProjectModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md card-surface p-4 sm:p-5 relative text-xs">
            <button
              type="button"
              onClick={() => setShowNewProjectModal(false)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-100 text-xs"
            >
              Close
            </button>
            <h3 className="text-sm font-semibold text-slate-100 mb-2">New Build</h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Create a new build with a project name, costume type, and optional CRL link.
            </p>
            <form onSubmit={handleCreateProjectFromModal} className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <label className="label">Project Name</label>
                <input
                  className="input-field"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. ANH Stunt TK"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="label">Costume Type</label>
                <input
                  className="input-field"
                  value={newProjectCostume}
                  onChange={(e) => setNewProjectCostume(e.target.value)}
                  placeholder="TK, TI, TB, etc."
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="label">CRL Link</label>
                <input
                  className="input-field"
                  value={newProjectCrlUrl}
                  onChange={(e) => setNewProjectCrlUrl(e.target.value)}
                  placeholder="https://databank.501st.com/..."
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn-secondary px-3 py-1 text-[11px]"
                  onClick={() => setShowNewProjectModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-3 py-1 text-[11px]">
                  Save & Open Build
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeProject && projectView === 'thread' && (
        <BuildThreadView
          project={activeProject}
          tasks={tasks}
          owner={UsersStore.getById ? (UsersStore as any).getById?.(activeProject.ownerId) ?? null : null}
        />
      )}

      {activeProject && showResourcesModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-4xl card-surface p-4 sm:p-5 relative text-xs">
            <button
              type="button"
              onClick={() => setShowResourcesModal(false)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-100 text-xs"
            >
              Close
            </button>
            <h3 className="text-sm font-semibold text-slate-100 mb-2">
              Build Resources & Vendors
            </h3>
            <p className="text-[11px] text-slate-500 mb-3 max-w-2xl">
              Add resources for this build and automatically grow a shared vendor library for
              future costumes.
            </p>

            <div className="space-y-3">
              <form
                onSubmit={handleAddVendor}
                className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 items-end"
              >
                <div className="flex flex-col gap-1">
                  <label className="label">Vendor / Resource Name</label>
                  <input
                    className="input-field"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Armor Maker, Paint Brand"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="label">Item / Part</label>
                  <input
                    className="input-field"
                    value={vendorPart}
                    onChange={(e) => setVendorPart(e.target.value)}
                    placeholder="e.g. ANH Stunt Kit, Boots, E-11 Blaster"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="label">Website / Link</label>
                  <input
                    className="input-field"
                    value={vendorWebsite}
                    onChange={(e) => setVendorWebsite(e.target.value)}
                    placeholder="https://..."
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
                <button type="submit" className="btn-secondary mt-2">
                  Add Resource
                </button>
              </form>

              <div className="border border-slate-800 rounded-md overflow-hidden">
                <div className="grid grid-cols-5 gap-1 px-2 py-1.5 text-[10px] bg-slate-950/80 text-slate-400">
                  <span>Vendor</span>
                  <span>Item</span>
                  <span>Cost</span>
                  <span>Website</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="divide-y divide-slate-800 text-[11px] max-h-72 overflow-y-auto">
                  {tasks
                    .filter((t) => t.projectId === activeProject.id)
                    .flatMap((t) => (t.vendors || []).map((v) => ({ vendor: v, taskTitle: t.title })))
                    .map(({ vendor }) => (
                      <div
                        key={vendor.id}
                        className="grid grid-cols-5 gap-1 px-2 py-1 items-center bg-slate-950/40"
                      >
                        <div className="truncate text-slate-100">{vendor.name}</div>
                        <div className="truncate text-slate-200">{vendor.part || '—'}</div>
                        <div className="truncate text-slate-200">
                          {typeof vendor.cost === 'number'
                            ? `$${vendor.cost.toFixed(2)}`
                            : '—'}
                        </div>
                        <div className="truncate text-slate-200">
                          {vendor.website ? (
                            <a
                              href={vendor.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-imperial-red hover:underline truncate inline-block"
                            >
                              {vendor.website}
                            </a>
                          ) : (
                            '—'
                          )}
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveVendor(vendor.id)}
                            className="text-[10px] text-slate-500 hover:text-imperial-red"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Global resource library */}
              <div className="mt-4 border border-slate-800 rounded-md overflow-hidden">
                <div className="flex items-center justify-between px-2 py-1.5 bg-slate-950/80 text-[10px] text-slate-400">
                  <p className="uppercase tracking-wide">Shared Resource Library</p>
                  <p className="text-[10px] text-slate-500">
                    Entries from all builds on this device
                  </p>
                </div>
                <div className="grid grid-cols-5 gap-1 px-2 py-1.5 text-[10px] bg-slate-950/60 text-slate-400 border-t border-slate-800">
                  <span>Vendor</span>
                  <span>Item</span>
                  <span>Cost</span>
                  <span>Used On</span>
                  <span className="text-right">Attach</span>
                </div>
                <div className="divide-y divide-slate-800 text-[11px] max-h-60 overflow-y-auto">
                  {ResourceLibraryStore.getAll().length === 0 ? (
                    <div className="px-2 py-2 text-[11px] text-slate-500">
                      No shared resources yet. Adding vendors will grow this library for future builds.
                    </div>
                  ) : (
                    ResourceLibraryStore.getAll().map((entry) => (
                      <div
                        key={entry.id}
                        className="grid grid-cols-5 gap-1 px-2 py-1 items-center bg-slate-950/40"
                      >
                        <div className="truncate text-slate-100">{entry.name}</div>
                        <div className="truncate text-slate-200">{entry.item}</div>
                        <div className="truncate text-slate-200">
                          {typeof entry.cost === 'number'
                            ? `$${entry.cost.toFixed(2)}`
                            : '—'}
                        </div>
                        <div className="truncate text-[10px] text-slate-400">
                          {entry.costumeTypeUsed || '—'}
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="text-[10px] text-emerald-400 hover:text-emerald-200"
                            onClick={() => {
                              const activeProject =
                                projects.find((p) => p.id === activeProjectId) || null;
                              const targetTask =
                                selectedTask ||
                                (activeProject
                                  ? tasks.find((t) => t.projectId === activeProject.id) || null
                                  : null);
                              if (!targetTask) return;

                              const newVendor = {
                                id: crypto.randomUUID(),
                                name: entry.name,
                                website: entry.website || undefined,
                                part: entry.item,
                                cost: entry.cost,
                                color: undefined,
                                notesHtml: undefined,
                              };

                              if (useBackend) {
                                // Attach via API in a real backend scenario
                                // For now, just update local state
                                setTasks((prev) =>
                                  prev.map((t) =>
                                    t.id === targetTask.id
                                      ? { ...t, vendors: [...(t.vendors || []), newVendor] }
                                      : t,
                                  ),
                                );
                              } else {
                                ProjectStore.updateTask(targetTask.id, {
                                  vendors: [...(targetTask.vendors || []), newVendor],
                                });
                                refreshTasks(targetTask.projectId);
                              }
                            }}
                          >
                            Attach
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showChecklistItemModal && activeProject && activeChecklistAreaId && activeChecklistItemId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-3xl card-surface p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowChecklistItemModal(false)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-100 text-xs"
            >
              Close
            </button>

            {(() => {
              const area = checklistAreas.find((a) => a.id === activeChecklistAreaId);
              const item = area?.items.find((it) => it.id === activeChecklistItemId);
              if (!area || !item) return null;

              const handleSaveChecklistItem = () => {
                const updatedAreas = checklistAreas.map((a) =>
                  a.id === area.id
                    ? {
                        ...a,
                        items: a.items.map((it) =>
                          it.id === item.id
                            ? {
                                ...it,
                                builderNotesHtml: checklistBuilderNotes,
                                gmlNotesHtml: checklistGmlNotes,
                                images: checklistImages,
                              }
                            : it,
                        ),
                      }
                    : a,
                );
                setChecklistAreas(updatedAreas);
                ProjectChecklistStore.saveForProject(activeProject.id, updatedAreas);
                setShowChecklistItemModal(false);
              };

              const handleFilesChange = (files: FileList | null) => {
                if (!files || files.length === 0) return;
                const readers: Promise<string>[] = [];
                Array.from(files).forEach((file) => {
                  readers.push(
                    new Promise((resolve) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result as string);
                      reader.readAsDataURL(file);
                    }),
                  );
                });
                Promise.all(readers).then((dataUrls) => {
                  setChecklistImages((prev) => {
                    const base = prev ?? [];
                    const added = dataUrls.map((dataUrl) => ({ id: crypto.randomUUID(), dataUrl }));
                    return [...base, ...added];
                  });
                });
              };

              return (
                <div className="space-y-3 text-xs text-slate-300">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 mb-1">{item.label}</h3>
                    <p className="text-[11px] text-slate-500">Area: {area.name}</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <label className="label mb-0">Builder Notes</label>
                        <button
                          type="button"
                          className="text-[10px] text-slate-400 hover:text-slate-100"
                          onClick={() => {
                            setChecklistFullEditorTarget('builder');
                            setChecklistFullEditorValue(checklistBuilderNotes || '');
                            setShowChecklistFullEditor(true);
                          }}
                        >
                          Open full editor
                        </button>
                      </div>
                      <RichTextEditor
                        value={checklistBuilderNotes}
                        onChange={setChecklistBuilderNotes}
                        placeholder="Add build notes, fit considerations, weathering details, etc."
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <label className="label mb-0">GML Notes</label>
                        <button
                          type="button"
                          className="text-[10px] text-slate-400 hover:text-slate-100"
                          onClick={() => {
                            setChecklistFullEditorTarget('gml');
                            setChecklistFullEditorValue(checklistGmlNotes || '');
                            setShowChecklistFullEditor(true);
                          }}
                        >
                          Open full editor
                        </button>
                      </div>
                      <RichTextEditor
                        value={checklistGmlNotes}
                        onChange={setChecklistGmlNotes}
                        placeholder="Add approval notes, CRL clarifications, and adjustments."
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="label">Reference Photos</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFilesChange(e.target.files)}
                      className="text-[11px] text-slate-300"
                    />
                    {checklistImages && checklistImages.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-2">
                        {checklistImages.map((img) => (
                          <div
                            key={img.id}
                            className="relative group border border-slate-800 rounded-md overflow-hidden"
                          >
                            <img
                              src={img.annotatedDataUrl || img.dataUrl}
                              alt="Checklist reference"
                              className="w-full h-20 object-cover rounded-md"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity text-[10px]">
                              <button
                                type="button"
                                className="btn-secondary px-2 py-0.5"
                                onClick={() => setAnnotatingChecklistImageId(img.id)}
                              >
                                Markup
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowChecklistItemModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSaveChecklistItem}
                    >
                      Save Item Details
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
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