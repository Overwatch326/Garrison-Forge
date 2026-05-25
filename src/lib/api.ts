export interface ApiPhase {
  id: string;
  name: string;
  order: number;
  projectId: string;
}

export interface ApiComponent {
  id: string;
  name: string;
  type: string;
  sourceType: string;
  status: string;
  projectId: string;
}

export interface ApiProject {
  id: string;
  name: string;
  costumeType?: string | null;
  status?: string | null;
  ownerId: string;
  garrisonId: string;
  createdAt: string;
  updatedAt: string;
  phases?: ApiPhase[];
  components?: ApiComponent[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API GET ${path} failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API POST ${path} failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

async function apiPatch<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API PATCH ${path} failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function apiGetProjects(): Promise<ApiProject[]> {
  const data = await apiGet<{ projects: ApiProject[] }>('/projects');
  return data.projects;
}

export async function apiCreatePhase(
  projectId: string,
  input: { name: string; order?: number },
): Promise<ApiPhase> {
  const data = await apiPost<{ phase: ApiPhase }>(`/projects/${projectId}/phases`, input);
  return data.phase;
}

export async function apiCreateComponent(
  projectId: string,
  input: { name: string; type?: string; sourceType?: string },
): Promise<ApiComponent> {
  const data = await apiPost<{ component: ApiComponent }>(`/projects/${projectId}/components`, input);
  return data.component;
}

export async function apiCreateProject(input: {
  name: string;
  costumeType?: string;
  ownerId: string;
  garrisonId: string;
}): Promise<ApiProject> {
  const data = await apiPost<{ project: ApiProject }>('/projects', input);
  return data.project;
}

export async function apiUpdateProject(
  projectId: string,
  patch: Partial<Pick<ApiProject, 'status'>>,
): Promise<ApiProject> {
  const data = await apiPatch<{ project: ApiProject }>(`/projects/${projectId}`, patch);
  return data.project;
}

export interface ApiVendor {
  id: string;
  name: string;
  website?: string | null;
  part?: string | null;
  cost?: number | null;
  color?: string | null;
  notesHtml?: string | null;
  taskId: string;
}

export interface ApiImage {
  id: string;
  originalUrl: string;
  annotatedUrl?: string | null;
  caption?: string | null;
  taskId: string;
}

export interface ApiTask {
  id: string;
  title: string;
  descriptionHtml?: string | null;
  status: string;
  hours?: number | null;
  includeInThread: boolean;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  vendors?: ApiVendor[];
  images?: ApiImage[];
  phaseId?: string | null;
  componentId?: string | null;
}

export async function apiGetTasksForProject(projectId: string): Promise<ApiTask[]> {
  const data = await apiGet<{ project: ApiProject; tasks: ApiTask[] }>(`/projects/${projectId}/tasks`);
  return data.tasks;
}

export async function apiGetProjectWithTasks(
  projectId: string,
): Promise<{ project: ApiProject; tasks: ApiTask[] }> {
  const data = await apiGet<{ project: ApiProject; tasks: ApiTask[] }>(`/projects/${projectId}/tasks`);
  return data;
}

export async function apiCreateTask(
  projectId: string,
  title: string,
  opts?: { phaseId?: string; componentId?: string },
): Promise<ApiTask> {
  const data = await apiPost<{ task: ApiTask }>(`/projects/${projectId}/tasks`, {
    title,
    phaseId: opts?.phaseId,
    componentId: opts?.componentId,
  });
  return data.task;
}

export async function apiUpdateTask(
  taskId: string,
  patch: Partial<Pick<ApiTask, 'status' | 'descriptionHtml' | 'includeInThread' | 'hours'>>,
): Promise<ApiTask> {
  const data = await apiPatch<{ task: ApiTask }>(`/tasks/${taskId}`, patch);
  return data.task;
}

export type ApiTaskUpdate = Partial<
  Pick<ApiTask, 'status' | 'descriptionHtml' | 'includeInThread' | 'hours' | 'componentId'>
>;

export async function apiCreateVendor(taskId: string, input: Omit<ApiVendor, 'id' | 'taskId'>): Promise<ApiVendor> {
  const data = await apiPost<{ vendor: ApiVendor }>(`/tasks/${taskId}/vendors`, {
    name: input.name,
    website: input.website,
    part: input.part,
    cost: input.cost,
    color: input.color,
    notesHtml: input.notesHtml,
  });
  return data.vendor;
}

export async function apiDeleteVendor(vendorId: string): Promise<void> {
  await fetch(`${API_BASE}/vendors/${vendorId}`, { method: 'DELETE' });
}

export async function apiCreateImage(
  taskId: string,
  input: { dataUrl: string; caption?: string },
): Promise<ApiImage> {
  const data = await apiPost<{ image: ApiImage }>(`/tasks/${taskId}/images`, input);
  return data.image;
}

export async function apiUpdateImage(
  imageId: string,
  patch: { annotatedDataUrl?: string; caption?: string },
): Promise<ApiImage> {
  const data = await apiPatch<{ image: ApiImage }>(`/images/${imageId}`, patch);
  return data.image;
}

export async function apiDeleteImage(imageId: string): Promise<void> {
  await fetch(`${API_BASE}/images/${imageId}`, { method: 'DELETE' });
}
