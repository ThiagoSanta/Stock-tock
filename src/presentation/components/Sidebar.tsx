'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Receipt,
  Truck,
  Users,
  Settings,
  Search,
  CheckCircle2,
  AlertTriangle,
  LucideIcon,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

const navigationItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Catálogo', href: '/productos', icon: Package },
  { name: 'Inventario', href: '/inventario', icon: Boxes },
  { name: 'Pedidos', href: '/pedidos', icon: ShoppingBag },
  { name: 'Ventas', href: '/ventas', icon: Receipt },
  { name: 'Compras', href: '/compras', icon: Truck },
  { name: 'Clientes & Prov.', href: '/contactos', icon: Users },
  { name: 'Alertas & Reportes', href: '/alertas', icon: AlertTriangle },
  { name: 'Configuración', href: '#configuracion', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-[#101012] border-r border-[#222226] flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#222226]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#84cc16] flex items-center justify-center font-bold text-black text-sm shadow-[0_0_15px_rgba(132,204,22,0.35)]">
              ST
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-zinc-100 block leading-tight">
                Stock-tock
              </span>
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
                Enterprise V1
              </span>
            </div>
          </div>
        </div>

        {/* Search quick button */}
        <div className="px-3 pt-4 pb-2">
          <button className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-zinc-200 text-xs flex items-center justify-between transition-colors">
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Buscar producto, pedido...</span>
            </span>
            <kbd className="text-[10px] bg-[#27272a] text-zinc-400 px-1.5 py-0.5 rounded font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 py-2 space-y-1">
          <p className="px-2.5 py-1 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Plataforma
          </p>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#1e2024] text-[#84cc16] shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161619]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#84cc16]' : 'text-zinc-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold bg-[#84cc16]/15 text-[#84cc16] px-1.5 py-0.5 rounded-full border border-[#84cc16]/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info: Supabase & Account */}
      <div className="p-3 border-t border-[#222226]">
        <div className="px-3 py-2.5 rounded-lg bg-[#161619] border border-[#222226] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#84cc16] animate-pulse" />
            <span className="text-[11px] font-medium text-zinc-300">Supabase Cloud</span>
          </div>
          <CheckCircle2 className="w-3.5 h-3.5 text-[#84cc16]" />
        </div>
      </div>
    </aside>
  );
}
