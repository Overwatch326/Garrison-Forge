"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  apiCreateEventSignup,
  apiGetEvents,
  apiUpdateEventSignup,
  type ApiEvent,
  type ApiEventSignup,
} from '../lib/apiEvents';
import { apiGetUserCostumes, type ApiUserCostume } from '../lib/apiCostumes';
import type { User } from '../models/users';
import { UsersStore } from '../models/users';
import { roleHasPermission } from '../lib/permissions';

interface EventsBoardProps {
  currentUser: User;
}

export function EventsBoard({ currentUser }: EventsBoardProps) {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [scope, setScope] = useState<'upcoming' | 'past' | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [costumes, setCostumes] = useState<ApiUserCostume[]>([]);
  const [signupModalEvent, setSignupModalEvent] = useState<ApiEvent | null>(null);
  const [signupCostumeId, setSignupCostumeId] = useState<string>('');
  const [signupNotes, setSignupNotes] = useState('');
  const [signupSubmitting, setSignupSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await apiGetEvents(scope);
        setEvents(data);
      } catch {
        // ignore for now
      } finally {
        setLoading(false);
      }
    })();
  }, [scope]);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGetUserCostumes(currentUser.id);
        setCostumes(data);
      } catch {
        // ignore for now
      }
    })();
  }, [currentUser.id]);

  const now = useMemo(() => new Date(), []);

  function getUserSignup(ev: ApiEvent): ApiEventSignup | undefined {
    return ev.signups?.find((s) => s.userId === currentUser.id);
  }

  async function handleSubmitSignup() {
    if (!signupModalEvent) return;
    try {
      setSignupSubmitting(true);
      const existing = getUserSignup(signupModalEvent);
      if (existing) {
        await apiUpdateEventSignup(existing.id, {
          costumeId: signupCostumeId || undefined,
          notes: signupNotes || undefined,
        });
      } else {
        await apiCreateEventSignup(signupModalEvent.id, {
          userId: currentUser.id,
          userDisplayName: currentUser.displayName,
          userEmail: currentUser.email,
          costumeId: signupCostumeId || undefined,
          notes: signupNotes || undefined,
        });
      }
      const updatedEvents = await apiGetEvents(scope);
      setEvents(updatedEvents);
      setSignupModalEvent(null);
      setSignupCostumeId('');
      setSignupNotes('');
    } catch {
      // ignore for now
    } finally {
      setSignupSubmitting(false);
    }
  }

  async function handleAttendanceToggle(signup: ApiEventSignup, status: 'attended' | 'no_show') {
    try {
      await apiUpdateEventSignup(signup.id, { status });
      const updatedEvents = await apiGetEvents(scope);
      setEvents(updatedEvents);
    } catch {
      // ignore for now
    }
  }

  const canViewSignups = roleHasPermission(currentUser.role, 'events.view_signups');

  function getSignupDisplayName(s: ApiEventSignup): string {
    if (s.userDisplayName) return s.userDisplayName;
    if (s.userEmail) return s.userEmail;
    const user = UsersStore.getById(s.userId);
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email;
    return s.userId;
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="card-surface p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase mb-1">
              Events
            </h2>
            <p className="text-xs text-slate-400">
              Browse upcoming events and past troops, sign up with your costumes, and track your
              attendance.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            {canViewSignups && (
              <div className="px-2 py-1 rounded-md border border-slate-700 bg-slate-900/60 text-slate-300">
                Viewing member signups. (Admin)
              </div>
            )}

            <div className="flex gap-1">
            <button
              type="button"
              className={`px-2 py-1 rounded-md border transition-colors ${
                scope === 'upcoming'
                  ? 'border-imperial-red bg-imperial-red/20 text-slate-100'
                  : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-imperial-red/70'
              }`}
              onClick={() => setScope('upcoming')}
            >
              Upcoming
            </button>
            <button
              type="button"
              className={`px-2 py-1 rounded-md border transition-colors ${
                scope === 'past'
                  ? 'border-imperial-red bg-imperial-red/20 text-slate-100'
                  : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-imperial-red/70'
              }`}
              onClick={() => setScope('past')}
            >
              Past
            </button>
            <button
              type="button"
              className={`px-2 py-1 rounded-md border transition-colors ${
                scope === 'all'
                  ? 'border-imperial-red bg-imperial-red/20 text-slate-100'
                  : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-imperial-red/70'
              }`}
              onClick={() => setScope('all')}
            >
              All
            </button>
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-2 text-xs">
          {loading && <p className="text-[11px] text-slate-500">Loading events…</p>}
          {!loading && events.length === 0 && (
            <p className="text-[11px] text-slate-500">No events found for this view.</p>
          )}

          {!loading && events.length > 0 && (
            <div className="flex flex-col gap-2">
              {events.map((ev) => {
                const userSignup = getUserSignup(ev);
                const signups = ev.signups || [];

                return (
                  <div
                  key={ev.id}
                  className="border border-slate-800 rounded-md p-3 bg-slate-900/70 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[12px] font-semibold text-slate-100 truncate">
                        {ev.title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(ev.startTime).toLocaleString()} @ {ev.location}
                      </div>
                    </div>
                    <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border border-slate-700 text-slate-300">
                      {ev.official ? 'Official' : 'Unofficial'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {ev.description || 'No description provided.'}
                  </div>

                  {canViewSignups && signups.length > 0 && (
                    <details className="mt-1 text-[10px] text-slate-400">
                      <summary className="cursor-pointer select-none">
                        <span className="font-semibold text-slate-200">Signups:</span>{' '}
                        {signups.length}{' '}
                        {signups.length === 1 ? 'member' : 'members'} registered.
                      </summary>
                      <div className="mt-1 max-h-40 overflow-y-auto pr-1 space-y-1">
                        {signups.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between gap-2 border border-slate-800 rounded px-1.5 py-0.5 bg-slate-950/60"
                          >
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-200">
                                {getSignupDisplayName(s)}
                              </span>
                              <span className="text-[9px] text-slate-500">
                                {s.costume
                                  ? `${s.costume.name}${s.costume.costumeType ? ` (${s.costume.costumeType})` : ''}`
                                  : 'No costume set'}
                              </span>
                            </div>
                            <div className="flex flex-col items-end text-[9px] text-slate-500">
                              <span>Status: {s.status}</span>
                              {s.notes && <span className="line-clamp-1">{s.notes}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  <div className="flex flex-wrap gap-1 text-[9px] text-slate-500 mt-1">
                    <span className="px-1.5 py-0.5 rounded-full border border-slate-700">
                      {ev.eventType}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full border border-slate-700">
                      {ev.participants}
                    </span>
                    {ev.childrenOk && (
                      <span className="px-1.5 py-0.5 rounded-full border border-slate-700">
                        Children Allowed
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded-full border border-slate-700">
                      Weapons: {ev.weaponsAllowed}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                    <div className="flex flex-wrap items-center gap-1 text-slate-500">
                      {(() => {
                        const signup = userSignup;
                        if (!signup) return <span>You are not signed up.</span>;
                        return (
                          <>
                            <span className="text-emerald-400">You are signed up.</span>
                            {signup.status === 'attended' && <span>Marked as attended.</span>}
                            {signup.status === 'no_show' && <span>Marked as did not attend.</span>}
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded-md border border-slate-700 bg-slate-900/70 text-[10px] text-slate-200 hover:border-imperial-red/70"
                        onClick={() => {
                          setSignupModalEvent(ev);
                          setSignupCostumeId(userSignup?.costumeId || '');
                          setSignupNotes(userSignup?.notes || '');
                        }}
                      >
                        {userSignup ? 'Manage Signup' : 'Sign Up'}
                      </button>
                      {(() => {
                        const signup = userSignup;
                        if (!signup || !ev.endTime) return null;
                        const eventEnd = new Date(ev.endTime);
                        if (eventEnd > now) return null;
                        return (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="px-2 py-0.5 rounded-md border border-slate-700 bg-slate-900/70 text-[10px] text-emerald-400 hover:border-emerald-500"
                              onClick={() => handleAttendanceToggle(signup, 'attended')}
                            >
                              Attended
                            </button>
                            <button
                              type="button"
                              className="px-2 py-0.5 rounded-md border border-slate-700 bg-slate-900/70 text-[10px] text-red-400 hover:border-red-500"
                              onClick={() => handleAttendanceToggle(signup, 'no_show')}
                            >
                              Did Not Attend
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {signupModalEvent && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
          <div className="card-surface w-full max-w-sm p-4 sm:p-5 text-xs text-slate-200">
            <h3 className="text-sm font-semibold mb-2">
              {getUserSignup(signupModalEvent) ? 'Manage Signup' : 'Sign Up'} –
              <span className="ml-1 text-slate-300">{signupModalEvent.title}</span>
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Choose the costume you plan to wear and optionally add notes for the event organizers.
            </p>

            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-1">
                <span className="label">Costume</span>
                <select
                  className="input-field text-[11px]"
                  value={signupCostumeId}
                  onChange={(e) => setSignupCostumeId(e.target.value)}
                >
                  <option value="">No specific costume</option>
                  {costumes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.costumeType ? `(${c.costumeType})` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="label">Notes</span>
                <textarea
                  className="input-field min-h-[60px] resize-y text-[11px]"
                  value={signupNotes}
                  onChange={(e) => setSignupNotes(e.target.value)}
                  placeholder="Arrival time, ride needs, special considerations, etc."
                />
              </label>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary px-3 py-1 text-[11px]"
                  onClick={() => {
                    setSignupModalEvent(null);
                    setSignupCostumeId('');
                    setSignupNotes('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary px-3 py-1 text-[11px] disabled:opacity-60"
                  disabled={signupSubmitting}
                  onClick={handleSubmitSignup}
                >
                  {signupSubmitting
                    ? 'Saving...'
                    : getUserSignup(signupModalEvent)
                    ? 'Update Signup'
                    : 'Confirm Signup'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
