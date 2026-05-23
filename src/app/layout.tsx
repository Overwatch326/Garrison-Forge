import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Garrison Forge',
  description: 'Build, document, and manage 501st armor projects.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="imperial-gradient">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-800/80 bg-bg-soft/95 backdrop-blur-sm shadow-lg">
            <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
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
                  Inspired by the 501st Legion – manage armor builds, roles, and access.
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 flex flex-col gap-6">
            {children}
          </main>

          <footer className="border-t border-slate-800/80 bg-bg-soft/95 text-[11px] text-slate-500">
            <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-between">
              <span>Garrison Forge – unofficial tool for 501st-style build threads.</span>
              <span className="hidden sm:inline">All data/storage behavior is WIP – do not rely on for official records yet.</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
