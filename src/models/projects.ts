import type { UserId } from './users';

export type ProjectId = string;
export type TaskId = string;

export type TaskStatus = 'research' | 'ordering' | 'build' | 'approval';

export type PhaseId = string;
export type ComponentId = string;

export interface Phase {
  id: PhaseId;
  projectId: ProjectId;
  name: string;
  order: number;
}

export type ComponentType = 'armor-piece' | 'soft-part' | 'prop' | 'electronics' | 'other';
export type ComponentSourceType = 'scratch-built' | '3d-printed' | 'commissioned' | 'purchased' | 'unknown';
export type ComponentStatus = 'not-started' | 'in-progress' | 'ready-for-approval' | 'approved';

export interface Component {
  id: ComponentId;
  projectId: ProjectId;
  name: string;
  type: ComponentType;
  sourceType: ComponentSourceType;
  status: ComponentStatus;
}

export interface VendorResource {
  id: string;
  name: string;
  website?: string;
  part?: string;
  cost?: number;
  color?: string;
  notesHtml?: string; // rich text html
}

export interface TaskImage {
  id: string;
  dataUrl: string; // original image data
  annotatedDataUrl?: string; // optional annotated version
  caption?: string;
}

export interface Task {
  id: TaskId;
  projectId: ProjectId;
  phaseId?: PhaseId;
  componentId?: ComponentId;
  title: string;
  descriptionHtml?: string; // rich text
  status: TaskStatus;
  hours?: number;
  includeInThread?: boolean;
  vendors: VendorResource[];
  images: TaskImage[];
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'active' | 'closed';

export interface Project {
  id: ProjectId;
  ownerId: UserId;
  name: string;
  costumeType?: string;
  status?: ProjectStatus;
  members: UserId[]; // owner + collaborators
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: Project[];
  tasks: Task[];
}

const STORAGE_KEY = 'garrison-forge-projects-v1';

function nowIso() {
  return new Date().toISOString();
}

function loadState(): ProjectState {
  if (typeof window === 'undefined') return { projects: [], tasks: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { projects: [], tasks: [] };
    const parsed = JSON.parse(raw) as ProjectState;
    const projects = (parsed.projects ?? []).map((p) => ({
      ...p,
      status: (p as any).status || 'active',
      members: Array.isArray((p as any).members) && (p as any).members.length
        ? (p as any).members
        : [p.ownerId],
    }));

    const tasks = (parsed.tasks ?? []).map((t) => ({
      ...t,
      vendors: Array.isArray((t as any).vendors) ? (t as any).vendors : [],
      images: Array.isArray((t as any).images) ? (t as any).images : [],
      includeInThread:
        typeof (t as any).includeInThread === 'boolean' ? (t as any).includeInThread : true,
    }));

    return { projects, tasks };
  } catch {
    return { projects: [], tasks: [] };
  }
}

function saveState(state: ProjectState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

let state: ProjectState = { projects: [], tasks: [] };

if (typeof window !== 'undefined') {
  state = loadState();
}

export const ProjectStore = {
  getProjectsForUser(ownerId: UserId): Project[] {
    return state.projects.filter((p) => p.ownerId === ownerId);
  },

  getTasksForProject(projectId: ProjectId): Task[] {
    return state.tasks.filter((t) => t.projectId === projectId);
  },

  createProject(ownerId: UserId, name: string, costumeType?: string): Project {
    const project: Project = {
      id: crypto.randomUUID(),
      ownerId,
      name,
      costumeType,
      status: 'active',
      members: [ownerId],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.projects = [project, ...state.projects];
    saveState(state);
    return project;
  },

  getProjectById(id: ProjectId): Project | null {
    return state.projects.find((p) => p.id === id) ?? null;
  },

  addMember(projectId: ProjectId, userId: UserId): Project | null {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return null;
    if (!project.members.includes(userId)) {
      project.members.push(userId);
      project.updatedAt = nowIso();
      saveState(state);
    }
    return project;
  },

  removeMember(projectId: ProjectId, userId: UserId): Project | null {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return null;
    if (userId === project.ownerId) return project; // owner cannot be removed
    project.members = project.members.filter((id) => id !== userId);
    project.updatedAt = nowIso();
    saveState(state);
    return project;
  },

  createTask(projectId: ProjectId, title: string): Task {
    const task: Task = {
      id: crypto.randomUUID(),
      projectId,
      title,
      descriptionHtml: '',
      status: 'research',
      vendors: [],
      images: [],
      includeInThread: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.tasks = [task, ...state.tasks];
    saveState(state);
    return task;
  },

  updateTask(taskId: TaskId, patch: Partial<Task>): Task | null {
    const idx = state.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return null;
    state.tasks[idx] = {
      ...state.tasks[idx],
      ...patch,
      updatedAt: nowIso(),
    };
    saveState(state);
    return state.tasks[idx];
  },

  updateProjectStatus(projectId: ProjectId, status: ProjectStatus): Project | null {
    const proj = state.projects.find((p) => p.id === projectId);
    if (!proj) return null;
    proj.status = status;
    proj.updatedAt = nowIso();
    saveState(state);
    return proj;
  },
};
