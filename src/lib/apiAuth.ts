const API_BASE = 'http://localhost:4000';

async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    const err: any = new Error(`API POST ${path} failed: ${res.status} ${text}`);
    err.status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string | null;
  legionId?: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function apiRegister(email: string, password: string, displayName?: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/register', { email, password, displayName });
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/login', { email, password });
}
