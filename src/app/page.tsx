"use client";

import { useState } from "react";
import { AuthTabs } from "../components/AuthTabs";
import { RoleSettingsPanel } from "../components/RoleSettingsPanel";
import type { Role } from "../models/roles";

export default function HomePage() {
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start">
        <div className="space-y-4">
          <div className="card-surface p-4 sm:p-6 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
              Welcome to Garrison Forge
            </h2>
            <p className="text-sm text-slate-300">
              Login or register to start managing build threads for your garrison. Roles and access
              levels are inspired by 501st structures (Admins, Members, and custom leadership
              roles).
            </p>
            <p className="text-xs text-slate-500">
              This is an early preview: authentication and role enforcement are local-only for
              now. We&apos;ll wire this up to a real backend and Postgres as we progress.
            </p>
          </div>

          <AuthTabs onAuthenticated={setCurrentUserRole} />
        </div>

        <div className="space-y-4">
          <RoleSettingsPanel />

          <div className="card-surface p-4 sm:p-5 text-sm text-slate-300 flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Current Session
            </h3>
            {currentUserRole ? (
              <>
                <p>
                  You are signed in as a role with label <span className="badge-role">{currentUserRole.label}</span>.
                </p>
                <p className="text-[11px] text-slate-400">
                  In a future iteration, this role will control what you can do across projects:
                  who can manage garrison-wide settings, approve build threads, or administer
                  member access.
                </p>
              </>
            ) : (
              <p className="text-[13px] text-slate-400">
                Not signed in. Use the login/register panel to simulate authentication and role
                selection.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="card-surface p-4 sm:p-6 text-xs text-slate-400 space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
          Next Steps (Planned)
        </h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Wire authentication and roles to a backend with PostgreSQL (Railway/Vercel).</li>
          <li>Create project dashboards and build-thread views for each armor build.</li>
          <li>Integrate the image upload & markup tools into per-project updates.</li>
          <li>Define granular permissions per role (who can edit, approve, and manage members).</li>
        </ul>
      </section>
    </div>
  );
}
