const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export interface ApiUserCostume {
  id: string;
  name: string;
  costumeType?: string | null;
  approved: boolean;
  userId: string;
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

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`API DELETE ${path} failed with ${res.status}`);
}

export async function apiGetUserCostumes(userId: string): Promise<ApiUserCostume[]> {
  const data = await apiGet<{ costumes: ApiUserCostume[] }>(`/users/${userId}/costumes`);
  return data.costumes;
}

export async function apiCreateUserCostume(
  userId: string,
  input: { name: string; costumeType?: string; approved?: boolean },
): Promise<ApiUserCostume> {
  const data = await apiPost<{ costume: ApiUserCostume }>(`/users/${userId}/costumes`, input);
  return data.costume;
}

export async function apiDeleteUserCostume(costumeId: string): Promise<void> {
  await apiDelete(`/costumes/${costumeId}`);
}
