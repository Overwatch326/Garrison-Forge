import { useState } from 'react';
import { AppConfigStore } from '../models/appConfig';

export function GarrisonInfoSettingsPanel() {
  const cfg = AppConfigStore.getGarrison();
  const [name, setName] = useState(cfg.name || '');
  const [forumUrl, setForumUrl] = useState(cfg.forumUrl || '');
  const [threadHeader, setThreadHeader] = useState(cfg.threadHeader || '');
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    AppConfigStore.updateGarrison({
      name: name.trim() || 'Your Garrison',
      forumUrl: forumUrl.trim() || undefined,
      threadHeader: threadHeader.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <form onSubmit={handleSave} className="card-surface p-4 sm:p-6 flex flex-col gap-3 text-xs">
      <div>
        <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
          Garrison Info
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Set your garrison name and forum details. These are used when generating build thread
          exports.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="label">Garrison Name</label>
          <input
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Central Garrison, Arkansas Garrison"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label">Forum URL</label>
          <input
            className="input-field"
            value={forumUrl}
            onChange={(e) => setForumUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="label">Default Build Thread Header (optional)</label>
        <textarea
          className="input-field min-h-[80px] text-[11px]"
          value={threadHeader}
          onChange={(e) => setThreadHeader(e.target.value)}
          placeholder="Short intro used at the top of exported build threads."
        />
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button type="submit" className="btn-primary px-3 py-1 text-[11px]">
          Save Garrison Info
        </button>
        {saved && <span className="text-[11px] text-emerald-400">Saved.</span>}
      </div>
    </form>
  );
}
