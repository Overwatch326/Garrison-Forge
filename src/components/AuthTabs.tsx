"use client";

import { useState } from "react";
import { UsersStore, type User } from "../models/users";
import { apiLogin, apiRegister } from "../lib/apiAuth";

interface AuthTabsProps {
  onAuthenticated: (user: User) => void;
}

export function AuthTabs({ onAuthenticated }: AuthTabsProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      if (activeTab === "register") {
        // Call backend register; also mirror user into local UsersStore for now.
        const resp = await apiRegister(email.trim(), password, displayName.trim());
        const localUser = UsersStore.register(email.trim(), displayName.trim(), password);
        onAuthenticated(localUser);
        window.localStorage.setItem("garrison-auth-token", resp.token);
        return;
      }

      let resp;
      try {
        resp = await apiLogin(email.trim(), password);
      } catch (err: any) {
        // If backend returns 401 but local login succeeds, auto-register on backend to preserve work.
        const localUser = UsersStore.login(email.trim(), password);
        if (err.status === 401 && localUser) {
          try {
            const auto = await apiRegister(email.trim(), password, localUser.displayName || "");
            window.localStorage.setItem("garrison-auth-token", auto.token);
            onAuthenticated(localUser);
            return;
          } catch (inner: any) {
            setError(inner.message || "Authentication failed");
            return;
          }
        }
        throw err;
      }

      const existingLocal = UsersStore.login(email.trim(), password);
      if (!existingLocal) {
        // If no local user yet, create one matching backend basics.
        const created = UsersStore.register(email.trim(), resp.user.displayName || "", password);
        onAuthenticated(created);
      } else {
        onAuthenticated(existingLocal);
      }
      window.localStorage.setItem("garrison-auth-token", resp.token);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    }
  }

  return (
    <div className="card-surface p-4 sm:p-6 flex flex-col gap-4 max-w-md w-full">
      <div className="flex border-b border-slate-800/80 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <button
          type="button"
          onClick={() => {
            setActiveTab("login");
            setError(null);
          }}
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
          onClick={() => {
            setActiveTab("register");
            setError(null);
          }}
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

        {activeTab === "register" && (
          <p className="text-[11px] text-slate-500 mt-0.5">
            Use this account to plan, build, and track your costume projects and troop events in one
            place. You can add builds, log resources, track progress, and keep an eye on upcoming
            outings.
          </p>
        )}

        {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}

        <button type="submit" className="btn-primary mt-2">
          {activeTab === "login" ? "Log In" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
