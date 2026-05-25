import React, { useState } from 'react';

// Very small helper to trigger a download from a Response
async function downloadResponseAsFile(res: Response, suggestedName: string) {
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function BackupPanel() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setIsDownloading(true);
    setError(null);

    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/admin/backup`, {
        method: 'POST',
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Backup failed: ${res.status} ${text}`);
      }

      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const filename = match?.[1] || `garrison-forge-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

      await downloadResponseAsFile(res, filename);
    } catch (err: any) {
      setError(err?.message ?? 'Backup failed');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="card-surface p-4 sm:p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">Data Backup / Export</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Download a JSON snapshot of core data (users, memberships, projects, events, and signups).
          This export is read-only; there is currently no automatic restore, so production data cannot
          be overwritten from this screen.
        </p>
      </div>

      {error && <p className="text-xs text-imperial-red">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 rounded bg-imperial-red px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-imperial-red/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? 'Preparing backup…' : 'Download Backup'}
        </button>
        <p className="text-[11px] text-slate-500">
          Recommended before making bulk changes to members, projects, or events.
        </p>
      </div>
    </div>
  );
}
