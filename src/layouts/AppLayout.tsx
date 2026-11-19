import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/presentation/components/Sidebar';

export function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Enlace de accesibilidad para saltar al contenido principal con teclado */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded focus:text-xs focus:font-semibold"
      >
        Saltar al contenido principal
      </a>

      <Sidebar />

      <main
        id="main-content"
        role="main"
        className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 focus:outline-none"
        tabIndex={-1}
      >
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
