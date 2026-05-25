import { useState } from 'react';
import { AuthTabs } from '../components/AuthTabs';
import { RoleSettingsPanel } from '../components/RoleSettingsPanel';
import { ProjectBoard } from '../components/ProjectBoard';
import { OverviewBoard } from '../components/OverviewBoard';
import { EventsBoard } from '../components/EventsBoard';
import { ProfileSettingsPanel } from '../components/ProfileSettingsPanel';
import { ProfileCostumesPanel } from '../components/ProfileCostumesPanel';
import { AppBrandingSettingsPanel } from '../components/AppBrandingSettingsPanel';
import { GarrisonInfoSettingsPanel } from '../components/GarrisonInfoSettingsPanel';
import { ThemeSettingsPanel } from '../components/ThemeSettingsPanel';
import { BackupPanel } from '../components/BackupPanel';
import { EventsAdminPanel } from '../components/EventsAdminPanel';
import { ChecklistSettingsPanel } from '../components/ChecklistSettingsPanel';
import { AppConfigStore } from '../models/appConfig';
import type { User } from '../models/users';

function SidebarNavButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-colors ${
        active
          ? 'bg-imperial-red/20 text-slate-100 border border-imperial-red/60'
          : 'text-slate-300 border border-transparent hover:border-imperial-red/60 hover:bg-slate-800/70'
      }`}
    >
      {children}
    </button>
  );
}

type SettingsView =
  | 'menu'
  | 'profile'
  | 'roles'
  | 'branding'
  | 'garrison-info'
  | 'theme'
  | 'events-admin'
  | 'checklists'
  | 'backup';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState<'auth' | 'dashboard'>('auth');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [section, setSection] = useState<'overview' | 'projects' | 'events' | 'settings'>('overview');
  const [startNewBuild, setStartNewBuild] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [settingsView, setSettingsView] = useState<SettingsView>('menu');
  const branding = AppConfigStore.getBranding();
  const theme = AppConfigStore.getTheme();

  function handleAuthenticated(user: User) {
    setCurrentUser(user);
    setPage('dashboard');
    setSection('overview');
  }

  function handleLogout() {
    setCurrentUser(null);
    setPage('auth');
    setSettingsView('menu');
  }

  const showAuth = page === 'auth' || !currentUser;

  if (showAuth) {
    return (
      <div className={`imperial-gradient min-h-screen flex flex-col theme-${theme}`}>
        <header className="border-b border-slate-800/80 bg-bg-soft/95 backdrop-blur-sm shadow-lg">
          <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-red-900/80 border border-red-500/70 flex items-center justify-center text-xs font-bold text-red-200">
                  GF
                </span>
                <h1 className="text-sm sm:text-base font-semibold tracking-[0.18em] uppercase text-slate-100">
                  Garrison Forge
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Login or register to access your build projects and garrison tools.
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md space-y-4">
            <div className="card-surface p-4 sm:p-6 flex flex-col gap-3 text-center">
              <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
                Welcome to Garrison Forge
              </h2>
              <p className="text-sm text-slate-300">
                This is your local workshop for planning and tracking costume builds. The very first
                account on this device becomes an Admin; everyone else starts as a Member.
              </p>
              <p className="text-xs text-slate-500">
                Once you sign in, you&apos;ll land on the main dashboard with Builds and Settings
                navigation on the left.
              </p>
            </div>

            <AuthTabs onAuthenticated={handleAuthenticated} />
          </div>
        </main>
      </div>
    );
  }

  // Dashboard layout (authenticated)
  return (
    <div className={`imperial-gradient min-h-screen flex flex-col theme-${theme}`}>
      <header className="border-b border-slate-800/80 bg-bg-soft/95 backdrop-blur-sm shadow-lg">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-imperial-red/70 hover:text-imperial-red"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle navigation menu"
            >
              <span className="block w-4 h-[1px] bg-slate-200 mb-1" />
              <span className="block w-4 h-[1px] bg-slate-200 mb-1" />
              <span className="block w-4 h-[1px] bg-slate-200" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-red-900/80 border border-red-500/70 flex items-center justify-center text-xs font-bold text-red-200">
                  GF
                </span>
                <h1 className="text-sm sm:text-base font-semibold tracking-[0.18em] uppercase text-slate-100">
                  Garrison Forge
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Dashboard – manage your builds and garrison settings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <div className="text-right hidden sm:block">
              <div className="font-semibold text-slate-100 truncate max-w-[200px]">
                {currentUser?.displayName || currentUser?.email}
              </div>
              <div className="text-[10px] text-slate-400">{currentUser?.role.label}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary px-3 py-1 text-[11px]"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 mx-auto w-full max-w-6xl flex">
        <aside
          className={`bg-bg-soft/95 border-r border-slate-800/80 w-56 shrink-0 p-3 flex-col gap-3 text-xs text-slate-300
          ${sidebarOpen ? 'flex' : 'hidden'}`}
        >
          <div className="mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Navigation
            </p>
          </div>
          <SidebarNavButton
            active={section === 'overview'}
            onClick={() => setSection('overview')}
          >
            Overview
          </SidebarNavButton>
          <SidebarNavButton
            active={section === 'projects'}
            onClick={() => setSection('projects')}
          >
            Builds
          </SidebarNavButton>
          <SidebarNavButton
            active={section === 'events'}
            onClick={() => setSection('events')}
          >
            Events
          </SidebarNavButton>
          <SidebarNavButton
            active={section === 'settings'}
            onClick={() => {
              setSection('settings');
              setSettingsView('menu');
            }}
          >
            Settings
          </SidebarNavButton>
        </aside>

        <main className="flex-1 px-4 py-4 flex flex-col gap-4 overflow-x-hidden">
          {section === 'overview' && currentUser && (
            <OverviewBoard
              currentUser={currentUser}
              onNewBuild={() => {
                setStartNewBuild(true);
                setSection('projects');
              }}
              onOpenBuild={(projectId) => {
                setSelectedProjectId(projectId);
                setSection('projects');
              }}
            />
          )}
          {section === 'projects' && currentUser && (
            <ProjectBoard
              currentUser={currentUser}
              startNewBuild={startNewBuild}
              onNewBuildHandled={() => setStartNewBuild(false)}
              selectedProjectId={selectedProjectId}
            />
          )}

          {section === 'events' && currentUser && <EventsBoard currentUser={currentUser} />}

          {section === 'settings' && currentUser && (
            <div className="flex flex-col gap-4">
              {settingsView === 'menu' && (
                <>
                  <div className="card-surface p-4 sm:p-6">
                    <h1 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
                      Settings
                    </h1>
                    <p className="text-sm text-slate-300 mt-1">
                      Choose what you want to configure.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      className="card-surface p-4 text-left text-sm text-slate-200 hover:border-imperial-red/70 transition-colors"
                      onClick={() => setSettingsView('profile')}
                    >
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1">
                        Profile
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Avatar, display name, bio, and forum-style signature.
                      </p>
                    </button>

                    <button
                      type="button"
                      className="card-surface p-4 text-left text-sm text-slate-200 hover:border-imperial-red/70 transition-colors"
                      onClick={() => setSettingsView('roles')}
                    >
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1">
                        Security Levels & Roles
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Configure roles and access levels (Admin, Member, and custom).
                      </p>
                    </button>

                    <button
                      type="button"
                      className="card-surface p-4 text-left text-sm text-slate-200 hover:border-imperial-red/70 transition-colors"
                      onClick={() => setSettingsView('branding')}
                    >
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1">
                        App Variables / Branding
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Set default logos and shared branding for this garrison.
                      </p>
                    </button>

                    <button
                      type="button"
                      className="card-surface p-4 text-left text-sm text-slate-200 hover:border-imperial-red/70 transition-colors"
                      onClick={() => setSettingsView('garrison-info')}
                    >
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1">
                        Garrison Info
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Name and forum URL used when exporting build threads.
                      </p>
                    </button>

                    <button
                      type="button"
                      className="card-surface p-4 text-left text-sm text-slate-200 hover:border-imperial-red/70 transition-colors"
                      onClick={() => setSettingsView('theme')}
                    >
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1">
                        Theme / Appearance
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Switch between a few high-contrast 501st-inspired themes.
                      </p>
                    </button>

                    <button
                      type="button"
                      className="card-surface p-4 text-left text-sm text-slate-200 hover:border-imperial-red/70 transition-colors"
                      onClick={() => setSettingsView('events-admin')}
                    >
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1">
                        Events / Troop Calendar
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Create and manage events members can sign up for.
                      </p>
                    </button>

                    <button
                      type="button"
                      className="card-surface p-4 text-left text-sm text-slate-200 hover:border-imperial-red/70 transition-colors"
                      onClick={() => setSettingsView('checklists')}
                    >
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1">
                        CRL Checklists
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Define shared body areas (Head, Torso, Legs) used in build checklists.
                      </p>
                    </button>

                    <button
                      type="button"
                      className="card-surface p-4 text-left text-sm text-slate-200 hover:border-imperial-red/70 transition-colors"
                      onClick={() => setSettingsView('backup')}
                    >
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-1">
                        Data Backup / Export
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Download a JSON backup of users, projects, and events.
                      </p>
                    </button>
                  </div>
                </>
              )}

              {settingsView === 'profile' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                      onClick={() => setSettingsView('menu')}
                    >
                      ← Back to Settings
                    </button>
                    <p className="text-[11px] text-slate-500">Profile Settings</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <ProfileSettingsPanel
                      currentUser={currentUser}
                      onUserUpdated={(u) => setCurrentUser(u)}
                    />
                    <ProfileCostumesPanel currentUser={currentUser} />
                  </div>
                </>
              )}

              {settingsView === 'roles' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                      onClick={() => setSettingsView('menu')}
                    >
                      ← Back to Settings
                    </button>
                    <p className="text-[11px] text-slate-500">Security Levels & Roles</p>
                  </div>

                  <RoleSettingsPanel />
                </>
              )}

              {settingsView === 'branding' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                      onClick={() => setSettingsView('menu')}
                    >
                      ← Back to Settings
                    </button>
                    <p className="text-[11px] text-slate-500">App Variables / Branding</p>
                  </div>

                  <AppBrandingSettingsPanel />
                </>
              )}

              {settingsView === 'garrison-info' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                      onClick={() => setSettingsView('menu')}
                    >
                      ← Back to Settings
                    </button>
                    <p className="text-[11px] text-slate-500">Garrison Info</p>
                  </div>

                  <GarrisonInfoSettingsPanel />
                </>
              )}

              {settingsView === 'theme' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                      onClick={() => setSettingsView('menu')}
                    >
                      ← Back to Settings
                    </button>
                    <p className="text-[11px] text-slate-500">Theme / Appearance</p>
                  </div>

                  <ThemeSettingsPanel />
                </>
              )}

              {settingsView === 'backup' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                      onClick={() => setSettingsView('menu')}
                    >
                      ← Back to Settings
                    </button>
                    <p className="text-[11px] text-slate-500">Data Backup / Export</p>
                  </div>

                  <BackupPanel />
                </>
              )}

              {settingsView === 'events-admin' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                      onClick={() => setSettingsView('menu')}
                    >
                      ← Back to Settings
                    </button>
                    <p className="text-[11px] text-slate-500">Events / Troop Calendar</p>
                  </div>

                  <EventsAdminPanel currentUser={currentUser} />
                </>
              )}

              {settingsView === 'checklists' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                      onClick={() => setSettingsView('menu')}
                    >
                      ← Back to Settings
                    </button>
                    <p className="text-[11px] text-slate-500">CRL Checklists</p>
                  </div>

                  <ChecklistSettingsPanel />
                </>
              )}
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-slate-800/80 bg-bg-soft/95 text-[11px] text-slate-500">
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-between">
          <span>Garrison Forge – local prototype.</span>
          <span className="hidden sm:inline">
            Auth, projects, and roles are currently stored in your browser only.
          </span>
        </div>
      </footer>
    </div>
  );
}