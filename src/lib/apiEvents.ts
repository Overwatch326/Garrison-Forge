const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export type EventScope = 'upcoming' | 'past' | 'all';

export interface ApiEventSignup {
  id: string;
  status: string;
  notes?: string | null;
  eventId: string;
  userId: string;
  userDisplayName?: string | null;
  userEmail?: string | null;
  costumeId?: string | null;
  costume?: {
    id: string;
    name: string;
    costumeType?: string | null;
    approved: boolean;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiEvent {
  id: string;
  title: string;
  description?: string | null;
  official: boolean;
  eventType: string;
  participants: string;
  costumes?: string | null;
  childrenOk: boolean;
  weaponsAllowed: string;
  location: string;
  startTime: string;
  endTime?: string | null;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  signups?: ApiEventSignup[];
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API GET ${path} failed with ${res.status}`);
  return (await res.json()) as T;
}

async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API POST ${path} failed with ${res.status}`);
  return (await res.json()) as T;
}

async function apiPatch<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API PATCH ${path} failed with ${res.status}`);
  return (await res.json()) as T;
}

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`API DELETE ${path} failed with ${res.status}`);
}

export async function apiGetEvents(scope: EventScope = 'upcoming'): Promise<ApiEvent[]> {
  const data = await apiGet<{ events: ApiEvent[] }>(`/events?scope=${scope}`);
  return data.events;
}

export async function apiCreateEvent(input: {
  title: string;
  description?: string;
  official: boolean;
  eventType: string;
  participants: string;
  costumes?: string;
  childrenOk: boolean;
  weaponsAllowed: string;
  location: string;
  startTime: string;
  endTime?: string;
  createdById: string | null;
}): Promise<ApiEvent> {
  const data = await apiPost<{ event: ApiEvent }>(`/events`, input);
  return data.event;
}

export async function apiUpdateEvent(
  id: string,
  patch: Partial<Pick<ApiEvent, 'title' | 'description' | 'official' | 'eventType' | 'participants' | 'costumes' | 'childrenOk' | 'weaponsAllowed' | 'location' | 'startTime' | 'endTime'>>,
): Promise<ApiEvent> {
  const data = await apiPatch<{ event: ApiEvent }>(`/events/${id}`, patch);
  return data.event;
}

export async function apiDeleteEvent(id: string): Promise<void> {
  await apiDelete(`/events/${id}`);
}

export async function apiCreateEventSignup(
  eventId: string,
  input: { userId: string; userDisplayName?: string; userEmail?: string; costumeId?: string; notes?: string },
): Promise<ApiEventSignup> {
  const data = await apiPost<{ signup: ApiEventSignup }>(`/events/${eventId}/signups`, input);
  return data.signup;
}

export async function apiUpdateEventSignup(
  signupId: string,
  patch: Partial<Pick<ApiEventSignup, 'status' | 'notes' | 'costumeId'>>,
): Promise<ApiEventSignup> {
  const data = await apiPatch<{ signup: ApiEventSignup }>(`/signups/${signupId}`, patch);
  return data.signup;
}