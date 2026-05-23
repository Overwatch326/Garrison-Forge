"use client";

import { RoleSettingsPanel } from "../../components/RoleSettingsPanel";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="card-surface p-4 sm:p-6">
        <h1 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
          Settings
        </h1>
        <p className="text-sm text-slate-300 mt-1">
          Configure security levels, titles, and high-level application behavior. This page will
          eventually be restricted to elevated roles (e.g. Admin, Garrison Staff).
        </p>
      </div>

      <RoleSettingsPanel />
    </div>
  );
}
