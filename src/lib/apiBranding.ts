const API_BASE = 'http://localhost:4000';

export interface LogoUploadResponse {
  url: string;
  kind: 'primary' | 'secondary';
}

export async function uploadBrandingLogo(
  dataUrl: string,
  kind: 'primary' | 'secondary' = 'primary',
): Promise<LogoUploadResponse> {
  const res = await fetch(`${API_BASE}/branding/logo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl, kind }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Logo upload failed: ${res.status} ${text}`);
  }
  return (await res.json()) as LogoUploadResponse;
}
