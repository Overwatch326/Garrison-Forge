"use client";

import { useState } from 'react';
import type { User } from '../models/users';
import { UsersStore } from '../models/users';
import { RichTextEditor } from './RichTextEditor';

interface ProfileSettingsPanelProps {
  currentUser: User;
  onUserUpdated?: (user: User) => void;
}

export function ProfileSettingsPanel({ currentUser, onUserUpdated }: ProfileSettingsPanelProps) {
  const [displayName, setDisplayName] = useState(currentUser.displayName || '');
  const [legionId, setLegionId] = useState(currentUser.profile?.legionId || '');
  const [bio, setBio] = useState(currentUser.profile?.bio || '');
  const [signatureHtml, setSignatureHtml] = useState(currentUser.profile?.signatureHtml || '');
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    currentUser.profile?.avatarDataUrl,
  );

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl);
      const updated = UsersStore.updateProfile(currentUser.id, { avatarDataUrl: dataUrl });
      if (updated && onUserUpdated) onUserUpdated(updated);
    };
    reader.readAsDataURL(file);
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();

    const trimmedDisplay = displayName.trim();
    if (trimmedDisplay && trimmedDisplay !== currentUser.displayName) {
      UsersStore.updateDisplayName(currentUser.id, trimmedDisplay);
    }

    const updated = UsersStore.updateProfile(currentUser.id, {
      legionId: legionId.trim() || undefined,
      bio: bio.trim() || undefined,
      signatureHtml: signatureHtml || undefined,
    });

    if (updated && onUserUpdated) onUserUpdated(updated);
  }

  const primaryId = currentUser.profile?.legionId || legionId || 'UNASSIGNED';
  const roleLabel = currentUser.role.label;

  return (
    <section className="card-surface p-0 overflow-hidden">
      {/* Hero header */}
      <div className="relative px-4 sm:px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-black via-slate-900 to-slate-800 flex flex-wrap items-center gap-4">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-black border-2 border-imperial-red flex items-center justify-center overflow-hidden text-xs text-slate-200 shadow-[0_0_25px_rgba(248,113,113,0.5)]">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-semibold tracking-[0.18em]">
                {(currentUser.displayName || currentUser.email)[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 border border-imperial-red/80 text-[10px] text-slate-200 cursor-pointer hover:bg-imperial-red/80 hover:text-white shadow-md">
            ✎
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        <div className="flex-1 min-w-[220px] text-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-semibold tracking-wide">
              {displayName || currentUser.displayName || currentUser.email}
            </h2>
            <span className="inline-flex items-center rounded-full border border-imperial-red/70 bg-imperial-red/20 px-2 py-0.5 text-[11px] tracking-[0.18em] uppercase">
              {primaryId}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center rounded-full border border-slate-600 bg-slate-900/60 px-2 py-0.5 text-[10px] uppercase tracking-wide">
              {roleLabel}
            </span>
            <span className="text-slate-500">{currentUser.email}</span>
          </div>
        </div>
      </div>

      {/* Form body */}
      <form onSubmit={handleSaveProfile} className="p-4 sm:p-6 flex flex-col gap-4 text-xs text-slate-300">
        <div className="grid gap-3 sm:grid-cols-2 max-w-2xl">
          <div className="flex flex-col gap-1">
            <label className="label">Display Name</label>
            <input
              className="input-field"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Vader Joe, TK-12345"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              Shown in headers and project ownership. Often your callsign or nickname.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="label">Legion ID</label>
            <input
              className="input-field tracking-[0.18em] uppercase"
              value={legionId}
              onChange={(e) => setLegionId(e.target.value.toUpperCase())}
              placeholder="e.g. TK-12345"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              Your official 501st Legion ID (TK, TI, TB, etc.). Used when exporting builds.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1 max-w-xl">
          <label className="label">Bio</label>
          <textarea
            className="input-field min-h-[72px] resize-y"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short intro, garrison affiliations, costume focus, etc."
          />
        </div>

        <div className="flex flex-col gap-1 max-w-xl">
          <label className="label">Forum Signature</label>
          <p className="text-[11px] text-slate-500 mb-1">
            This rich-text signature can be used when exporting build threads to forum posts or
            emails later.
          </p>
          <RichTextEditor
            value={signatureHtml}
            onChange={setSignatureHtml}
            placeholder="Add your standard signature, links, or call sign."
          />
        </div>

        <button type="submit" className="btn-primary mt-1 self-start">
          Save Profile
        </button>
      </form>
    </section>
  );
}
