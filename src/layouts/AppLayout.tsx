import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/presentation/components/Sidebar';

export function AppLayout() {
  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
