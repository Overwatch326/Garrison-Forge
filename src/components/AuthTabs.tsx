"use client";

import { useState } from "react";
import { Role, defaultRoles } from "../models/roles";

interface AuthTabsProps {
  onAuthenticated: (role: Role) => void;
}

export function AuthTabs({ onAuthenticated }: AuthTabsProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roleId, setRoleId] = useState<string>(defaultRoles.member.id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const roles = Object.values(defaultRoles);
    const selected = roles.find((r) => r.id === roleId) ?? defaultRoles.member;
    // For now, we just "log in" locally and bubble up the role
    onAuthenticated(selected);
  }

  return (
    <div className="card-surface p-4 sm:p-6 flex flex-col gap-4 max-w-md w-full">
      <div className="flex border-b border-slate-800/80 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <button
          type="button"
          onClick={() => setActiveTab("login")}
          className={`flex-1 py-2 border-b-2 text-center transition-colors ${
            activeTab === "login"
              ? "border-imperial-red text-slate-100"
              : "border-transparent hover:text-slate-200"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("register")}
          className={`flex-1 py-2 border-b-2 text-center transition-colors ${
            activeTab === "register"
              ? "border-imperial-red text-slate-100"
              : "border-transparent hover:text-slate-200"
          }`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {activeTab === "register" && (
          <div className="flex flex-col gap-1">
            <label className="label">Display Name</label>
            <input
              className="input-field"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. TK-####"
              required
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="label">Email</label>
          <input
            className="input-field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="label">Password</label>
          <input
            className="input-field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="label">Role</label>
          <select
            className="input-field bg-bg-softer/90"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          >
            {Object.values(defaultRoles).map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Roles and access levels are configurable later in Settings.
          </p>
        </div>

        <button type="submit" className="btn-primary mt-2">
          {activeTab === "login" ? "Log In" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
