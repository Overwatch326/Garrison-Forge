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
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState('');

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

  async function handleRestore() {
    if (!restoreFile) {
      setError('Choose a backup file first.');
      return;
    }

    if (restoreConfirm !== 'RESTORE') {
      setError("Type 'RESTORE' in the confirmation box to continue.");
      return;
    }

    setIsRestoring(true);
    setError(null);

    try {
      const text = await restoreFile.text();
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/admin/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text,
      });

      if (!res.ok) {
        const bodyText = await res.text();
        throw new Error(`Restore failed: ${res.status} ${bodyText}`);
      }

      const json = await res.json();
      if (!json.restored) {
        throw new Error('Restore endpoint did not report success.');
      }

      setRestoreFile(null);
      setRestoreConfirm('');
    } catch (err: any) {
      setError(err?.message ?? 'Restore failed');
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <div className="card-surface p-4 sm:p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">Data Backup / Export</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Download a JSON snapshot of core data (users, memberships, projects, events, and signups).
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

      <div className="border-t border-slate-800/80 pt-4 mt-2 flex flex-col gap-3">
        <div>
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">Restore from Backup</h3>
          <p className="text-[11px] text-amber-400 mt-1 max-w-xl">
            This will attempt to restore from a backup JSON file by calling the backend <code className="font-mono">/admin/restore</code>
            {' '}endpoint. The backend will only allow this if <code className="font-mono">ALLOW_RESTORE=true</code> is set and the database is empty.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            type="file"
            accept="application/json"
            className="text-[11px] file:text-[11px] file:px-2 file:py-1 file:mr-2 file:rounded file:border-0 file:bg-slate-700 file:text-slate-100"
            onChange={(e) => {
              setRestoreFile(e.target.files?.[0] ?? null);
            }}
          />
          <input
            type="text"
            value={restoreConfirm}
            onChange={(e) => setRestoreConfirm(e.target.value)}
            placeholder="Type RESTORE to confirm"
            className="mt-0 flex-1 rounded bg-slate-900 px-2 py-1 text-[11px] text-slate-100 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-imperial-red"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRestore}
            disabled={isRestoring}
            className="inline-flex items-center gap-2 rounded bg-amber-500 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-black hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRestoring ? 'Restoring…' : 'Restore from Backup'}
          </button>
          <p className="text-[10px] text-slate-500 max-w-xs">
            Use only on an empty database and only when <code className="font-mono">ALLOW_RESTORE=true</code> is set on the backend.
          </p>
        </div>
      </div>
    </div>
  );
}
