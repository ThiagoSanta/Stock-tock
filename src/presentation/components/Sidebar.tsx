import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Receipt,
  Truck,
  Users,
  AlertTriangle,
  Settings,
  Search,
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
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <aside
      aria-label="Barra lateral del sistema"
      className="w-60 h-screen bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none"
    >
      <div>
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div
              aria-hidden="true"
              className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center font-bold text-white text-xs"
            >
              ST
            </div>
            <div>
              <span className="font-semibold text-xs tracking-tight text-slate-900 block leading-tight">
                Stock-tock
              </span>
              <span className="text-[10px] text-slate-600 font-mono tracking-wider uppercase font-medium">
                Enterprise V1
              </span>
            </div>
          </div>
        </div>

        {/* Search quick button */}
        <div className="px-3 pt-3 pb-2">
          <button
            type="button"
            aria-label="Buscar en el sistema (Atajo Ctrl+K)"
            className="w-full h-8 px-2.5 rounded bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center justify-between hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span className="text-[11px] font-medium">Buscar...</span>
            </span>
            <kbd className="text-[10px] bg-slate-200 text-slate-700 px-1 py-0.5 rounded font-mono font-semibold">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Navegación principal" className="px-2 py-1 space-y-0.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    aria-hidden="true"
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-slate-900' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium bg-slate-200 text-slate-800">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Status footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between text-[11px] text-slate-700">
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"
            />
            <span className="font-semibold text-slate-800">Online</span>
          </div>
          <span className="font-mono text-[10px] text-slate-600 font-medium">PostgreSQL</span>
        </div>
      </div>
    </aside>
  );
}
