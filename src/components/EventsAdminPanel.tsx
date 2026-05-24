"use client";

import React, { useEffect, useState } from 'react';
import { apiCreateEvent, apiGetEvents, apiUpdateEvent, apiDeleteEvent, type ApiEvent } from '../lib/apiEvents';
import { roleHasPermission } from '../lib/permissions';
import type { User } from '../models/users';

interface EventsAdminPanelProps {
  currentUser: User;
}

export function EventsAdminPanel({ currentUser }: EventsAdminPanelProps) {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const canCreateOrManage = roleHasPermission(currentUser.role, 'events.create');
  const [editingEvent, setEditingEvent] = useState<ApiEvent | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [official, setOfficial] = useState(true);
  const [eventType, setEventType] = useState('movie-debut');
  const [participants, setParticipants] = useState('501st-only');
  const [costumes, setCostumes] = useState('');
  const [childrenOk, setChildrenOk] = useState(false);
  const [weaponsAllowed, setWeaponsAllowed] = useState('none');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function refreshEvents() {
    try {
      setLoading(true);
      const data = await apiGetEvents('all');
      setEvents(data);
    } catch {
      // ignore for now
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshEvents();
  }, []);

  function resetForm() {
    setTitle('');
    setDescription('');
    setOfficial(true);
    setEventType('movie-debut');
    setParticipants('501st-only');
    setCostumes('');
    setChildrenOk(false);
    setWeaponsAllowed('none');
    setLocation('');
    setStartTime('');
    setEndTime('');
    setEditingEvent(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreateOrManage) return;
    if (!title.trim() || !location.trim() || !startTime) return;
    try {
      setSubmitting(true);
      if (editingEvent) {
        await apiUpdateEvent(editingEvent.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          official,
          eventType,
          participants,
          costumes: costumes.trim() || undefined,
          childrenOk,
          weaponsAllowed,
          location: location.trim(),
          startTime,
          endTime: endTime || undefined,
        });
      } else {
        await apiCreateEvent({
          title: title.trim(),
          description: description.trim() || undefined,
          official,
          eventType,
          participants,
          costumes: costumes.trim() || undefined,
          childrenOk,
          weaponsAllowed,
          location: location.trim(),
          startTime,
          endTime: endTime || undefined,
          createdById: currentUser.id,
        });
      }
      resetForm();
      await refreshEvents();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card-surface p-4 sm:p-6 flex flex-col gap-3 text-xs text-slate-300">
      <div>
        <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
          Events / Troop Calendar
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Create and manage events. Members will see these under the Events navigation and can sign
          up with their costumes.
        </p>
        {!canCreateOrManage && (
          <p className="text-[11px] text-red-400 mt-1">
            You do not currently have permission to create or manage events. An admin can grant this
            in Security Levels &amp; Roles.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="label">Title</label>
          <input
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Movie Debut – The Mandalorian"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label">Location</label>
          <input
            className="input-field"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Venue / City"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label">Start Time</label>
          <input
            className="input-field"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label">End Time (optional)</label>
          <input
            className="input-field"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="label">Official / Unofficial</label>
          <label className="inline-flex items-center gap-2 text-[11px] text-slate-400">
            <input
              type="checkbox"
              className="h-3 w-3 rounded border-slate-700 bg-slate-900"
              checked={official}
              onChange={(e) => setOfficial(e.target.checked)}
            />
            <span>Official 501st event</span>
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <label className="label">Event Type</label>
          <select
            className="input-field"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            <option value="fundraiser">Fundraiser</option>
            <option value="festival">Festival</option>
            <option value="fun-run">Fun Run / Race</option>
            <option value="movie-debut">Movie Debut</option>
            <option value="charity-benefit">Charity Benefit</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="label">Participants</label>
          <select
            className="input-field"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
          >
            <option value="501st-only">501st Only</option>
            <option value="open">Open to Public</option>
            <option value="private">Private Event</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="label">Costumes Allowed</label>
          <input
            className="input-field"
            value={costumes}
            onChange={(e) => setCostumes(e.target.value)}
            placeholder="e.g. TK/TD/TB only, no helmets off, etc."
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="label">Children</label>
          <label className="inline-flex items-center gap-2 text-[11px] text-slate-400">
            <input
              type="checkbox"
              className="h-3 w-3 rounded border-slate-700 bg-slate-900"
              checked={childrenOk}
              onChange={(e) => setChildrenOk(e.target.checked)}
            />
            <span>Children Allowed</span>
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <label className="label">Weapons / Props</label>
          <select
            className="input-field"
            value={weaponsAllowed}
            onChange={(e) => setWeaponsAllowed(e.target.value)}
          >
            <option value="none">No weapons or props</option>
            <option value="lightsabers">Lightsabers allowed</option>
            <option value="blasters">Blasters allowed</option>
            <option value="other">Other / see notes</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
          <label className="label">Description</label>
          <textarea
            className="input-field min-h-[60px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional info, parking, contact, expectations, etc."
          />
        </div>

        <div className="flex items-center gap-2 mt-1">
          <button
            type="submit"
            className="btn-primary px-3 py-1 text-[11px] disabled:opacity-60"
            disabled={submitting || !canCreateOrManage}
          >
            {editingEvent ? 'Save Changes' : 'Create Event'}
          </button>
          {editingEvent && (
            <button
              type="button"
              className="btn-secondary px-3 py-1 text-[11px]"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="mt-3 flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          All Events
        </h3>
        {loading && <p className="text-[11px] text-slate-500">Loading events…</p>}
        {!loading && events.length === 0 && (
          <p className="text-[11px] text-slate-500">No events created yet.</p>
        )}
        {!loading && events.length > 0 && (
          <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="border border-slate-800 rounded-md p-2 bg-slate-900/70 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-100 truncate">
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
                <div className="text-[10px] text-slate-400 line-clamp-2">
                  {ev.description || 'No description provided.'}
                </div>
                <div className="flex items-center justify-end gap-2 mt-1 text-[10px]">
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-100"
                    onClick={() => {
                      setEditingEvent(ev);
                      setTitle(ev.title);
                      setDescription(ev.description || '');
                      setOfficial(ev.official);
                      setEventType(ev.eventType);
                      setParticipants(ev.participants);
                      setCostumes(ev.costumes || '');
                      setChildrenOk(ev.childrenOk);
                      setWeaponsAllowed(ev.weaponsAllowed || 'none');
                      setLocation(ev.location);
                      setStartTime(ev.startTime.slice(0, 16));
                      setEndTime(ev.endTime ? ev.endTime.slice(0, 16) : '');
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-red-400 hover:text-red-300"
                    onClick={async () => {
                      try {
                        await apiDeleteEvent(ev.id);
                        if (editingEvent && editingEvent.id === ev.id) {
                          resetForm();
                        }
                        await refreshEvents();
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}