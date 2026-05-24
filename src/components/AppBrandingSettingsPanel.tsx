"use client";

import { useState } from 'react';
import { AppConfigStore } from '../models/appConfig';
import { uploadBrandingLogo } from '../lib/apiBranding';

export function AppBrandingSettingsPanel() {
  const branding = AppConfigStore.getBranding();
  const [primaryLogoUrl, setPrimaryLogoUrl] = useState(branding.primaryLogoUrl);
  const [secondaryLogoUrl, setSecondaryLogoUrl] = useState(branding.secondaryLogoUrl || '');
  const [uploading, setUploading] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    AppConfigStore.updateBranding({
      primaryLogoUrl: primaryLogoUrl.trim() || '/assets/garrison-forge-wordmark.svg',
      secondaryLogoUrl: secondaryLogoUrl.trim() || undefined,
    });
  }

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    kind: 'primary' | 'secondary',
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        setUploading(true);
        const resp = await uploadBrandingLogo(dataUrl, kind);
        if (kind === 'primary') {
          setPrimaryLogoUrl(resp.url);
        } else {
          setSecondaryLogoUrl(resp.url);
        }
      } catch (err) {
        console.error('Logo upload failed', err);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="card-surface p-4 sm:p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
          App Variables / Branding
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Customize logos and basic branding so other garrisons can reuse this app with their own
          identity. These settings are stored locally for now.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-3 text-xs text-slate-300 max-w-xl">
        <div className="flex flex-col gap-1">
          <label className="label">Primary Logo URL</label>
          <input
            className="input-field"
            value={primaryLogoUrl}
            onChange={(e) => setPrimaryLogoUrl(e.target.value)}
            placeholder="/assets/your-garrison-logo.svg or https://..."
          />
          <p className="text-[10px] text-slate-500 mt-0.5">
            Used on the login screen and main header. Can be a local /assets path, a full URL, or
            uploaded from a file.
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
            <label className="inline-flex items-center gap-2 cursor-pointer text-slate-300">
              <span className="px-2 py-1 rounded-md border border-slate-700 bg-slate-900/70 hover:border-imperial-red/70">
                Choose File…
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'primary')}
                disabled={uploading}
              />
            </label>
            {uploading && <span className="text-[10px] text-slate-500">Uploading…</span>}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="label">Secondary Logo URL (optional)</label>
          <input
            className="input-field"
            value={secondaryLogoUrl}
            onChange={(e) => setSecondaryLogoUrl(e.target.value)}
            placeholder="/assets/your-mark.svg or leave blank"
          />
          <p className="text-[10px] text-slate-500 mt-0.5">
            Smaller mark used in compact areas. Leave blank to hide. You can also upload an image
            file.
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
            <label className="inline-flex items-center gap-2 cursor-pointer text-slate-300">
              <span className="px-2 py-1 rounded-md border border-slate-700 bg-slate-900/70 hover:border-imperial-red/70">
                Choose File…
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'secondary')}
                disabled={uploading}
              />
            </label>
            {uploading && <span className="text-[10px] text-slate-500">Uploading…</span>}
          </div>
        </div>

        <button type="submit" className="btn-secondary mt-2 self-start">
          Save Branding
        </button>
      </form>

      <div className="mt-2 grid gap-3 sm:grid-cols-2 text-xs text-slate-300">
        <div className="border border-slate-800 rounded-md p-3 flex flex-col items-center gap-2 bg-slate-900/60">
          <p className="label mb-1">Primary Logo Preview</p>
          {primaryLogoUrl ? (
            <img
              src={primaryLogoUrl}
              alt="Primary logo preview"
              className="max-h-12 object-contain"
            />
          ) : (
            <p className="text-[11px] text-slate-500">No primary logo set.</p>
          )}
        </div>
        <div className="border border-slate-800 rounded-md p-3 flex flex-col items-center gap-2 bg-slate-900/60">
          <p className="label mb-1">Secondary Logo Preview</p>
          {secondaryLogoUrl ? (
            <img
              src={secondaryLogoUrl}
              alt="Secondary logo preview"
              className="max-h-12 object-contain"
            />
          ) : (
            <p className="text-[11px] text-slate-500">No secondary logo set.</p>
          )}
        </div>
      </div>
    </section>
  );
}
