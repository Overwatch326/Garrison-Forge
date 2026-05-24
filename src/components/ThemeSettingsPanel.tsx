import { useState } from 'react';
import { AppConfigStore, type ThemeId } from '../models/appConfig';

const THEME_OPTIONS: { id: ThemeId; name: string; description: string }[] = [
  {
    id: 'night-ops',
    name: 'Night Ops (Default)',
    description: 'Deep imperial reds on a dark cockpit-style background.',
  },
  {
    id: 'hangar-bay',
    name: 'Hangar Bay',
    description: 'Slightly lighter greys, more contrast for planning builds.',
  },
  {
    id: 'briefing-room',
    name: 'Briefing Room',
    description: 'Lightest dark theme, higher contrast for long reading sessions.',
  },
  {
    id: 'command-bridge',
    name: 'Command Bridge',
    description: 'Bright, high-contrast imperial UI with light panels and dark chrome.',
  },
  {
    id: 'clone-rex',
    name: 'Clone Rex',
    description: 'Blue-and-white clone trooper scheme with subtle orange accents.',
  },
  {
    id: 'darth-maul',
    name: 'Darth Maul',
    description: 'Aggressive red-and-black theme inspired by the Zabrak Sith Lord.',
  },
  {
    id: 'boba-fett',
    name: 'Boba Fett',
    description: 'Muted Mandalorian armor palette: green, maroon, and sand tones.',
  },
];

export function ThemeSettingsPanel() {
  const currentTheme = AppConfigStore.getTheme();
  const [selected, setSelected] = useState<ThemeId>(currentTheme);

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    AppConfigStore.updateTheme(selected);
    // A full reload keeps things simple for now
    window.location.reload();
  }

  return (
    <form onSubmit={handleApply} className="card-surface p-4 sm:p-6 flex flex-col gap-3 text-xs">
      <div>
        <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
          Theme / Appearance
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Switch between a few 501st-inspired dark themes. This only affects your local view.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {THEME_OPTIONS.map((opt) => (
          <label
            key={opt.id}
            className={`cursor-pointer border rounded-md p-3 flex flex-col gap-1 text-[11px] transition-colors ${
              selected === opt.id
                ? 'border-imperial-red bg-slate-900/80'
                : 'border-slate-700 bg-slate-900/40 hover:border-imperial-red/70'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-100">{opt.name}</span>
              <input
                type="radio"
                name="theme"
                value={opt.id}
                checked={selected === opt.id}
                onChange={() => setSelected(opt.id)}
                className="h-3 w-3 text-imperial-red focus:ring-imperial-red/70 border-slate-600"
              />
            </div>
            <p className="text-[10px] text-slate-400">{opt.description}</p>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button type="submit" className="btn-primary px-3 py-1 text-[11px]">
          Apply Theme
        </button>
        <p className="text-[10px] text-slate-500">
          Theme preference is stored only in this browser.
        </p>
      </div>
    </form>
  );
}
