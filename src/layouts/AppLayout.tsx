import React, { Suspense, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { Sidebar } from '@/presentation/components/Sidebar';
import { CommandPalette } from '@/presentation/components/CommandPalette';

function PageLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="p-12 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs max-w-sm mx-auto mt-8 animate-in fade-in duration-200"
    >
      <div
        aria-hidden="true"
        className="w-5 h-5 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full animate-spin mx-auto mb-2"
      />
      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Cargando módulo...</p>
    </div>
  );
}

export function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('stocktock_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans transition-colors duration-200">
      {/* Enlace de accesibilidad para saltar al contenido principal con teclado */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-zinc-900 focus:text-white dark:focus:bg-zinc-100 dark:focus:text-zinc-900 focus:rounded-lg focus:text-xs focus:font-semibold"
      >
        Saltar al contenido principal
      </a>

      {/* Overlay móvil para cerrar el drawer */}
      {isMobileMenuOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[1px] md:hidden animate-in fade-in duration-150"
        />
      )}

      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onOpenSearch={() => setIsSearchOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar móvil (< md) */}
        <header className="h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between md:hidden shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menú de navegación"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Menu className="w-4 h-4" aria-hidden="true" />
          </button>

          <span className="text-sm font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Stock<span className="text-lime-500 font-black">·</span>tock
          </span>

          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Buscar en el sistema"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </button>
        </header>

        <main
          id="main-content"
          role="main"
          className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 focus:outline-none"
          tabIndex={-1}
        >
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<PageLoadingFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      </div>

      {/* Buscador de Comandos y Menús Global */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
