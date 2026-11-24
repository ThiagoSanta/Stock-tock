import React, { Suspense, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/presentation/components/Sidebar';
import { CommandPalette } from '@/presentation/components/CommandPalette';
import { useDesktopUpdater } from '@/utils/desktop/useDesktopUpdater';

function PageLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="p-12 text-center rounded-lg bg-white border border-slate-200 shadow-xs max-w-sm mx-auto mt-8 animate-in fade-in duration-200"
    >
      <div
        aria-hidden="true"
        className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"
      />
      <p className="text-xs font-semibold text-slate-700">Cargando módulo...</p>
    </div>
  );
}

export function AppLayout() {
  const { updateAvailable, version, relaunch } = useDesktopUpdater();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('stocktock_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('stocktock_sidebar_collapsed', String(next));
      } catch {
        // Silencioso
      }
      return next;
    });
  };

  // Atajo global Ctrl+K / Cmd+K para abrir el buscador
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-hidden font-sans transition-colors duration-200">
      {/* Enlace de accesibilidad para saltar al contenido principal con teclado */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white dark:focus:bg-zinc-100 dark:focus:text-zinc-900 focus:rounded focus:text-xs focus:font-semibold"
      >
        Saltar al contenido principal
      </a>

      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <main
        id="main-content"
        role="main"
        className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 focus:outline-none"
        tabIndex={-1}
      >
        <div className="max-w-7xl mx-auto">
          {updateAvailable && (
            <div className="mb-4 px-3.5 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-800 border border-lime-500/40 flex items-center justify-between shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                <span>Nueva actualización lista para instalar {version ? `(v${version})` : ''}</span>
              </div>
              <button
                type="button"
                onClick={relaunch}
                className="text-[11px] font-semibold px-2.5 py-1 rounded bg-lime-500 hover:bg-lime-400 text-black transition-colors cursor-pointer"
              >
                Reiniciar para aplicar
              </button>
            </div>
          )}
          <Suspense fallback={<PageLoadingFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      {/* Buscador de Comandos y Menús Global */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
