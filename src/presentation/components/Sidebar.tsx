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
  PanelLeftClose,
  PanelLeftOpen,
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

const prefetchMap: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/pages/DashboardPage'),
  '/productos': () => import('@/pages/ProductsPage'),
  '/inventario': () => import('@/pages/InventoryPage'),
  '/pedidos': () => import('@/pages/OrdersPage'),
  '/ventas': () => import('@/pages/SalesPage'),
  '/compras': () => import('@/pages/PurchasesPage'),
  '/contactos': () => import('@/pages/ContactsPage'),
  '/alertas': () => import('@/pages/AlertsPage'),
  '/configuracion': () => import('@/pages/SettingsPage'),
};

interface SidebarProps {
  onOpenSearch: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ onOpenSearch, isCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const handlePrefetch = (href: string) => {
    try {
      prefetchMap[href]?.();
    } catch {
      // Silencioso si falla la precarga
    }
  };

  return (
    <aside
      aria-label="Barra lateral del sistema"
      className={`${
        isCollapsed ? 'w-16' : 'w-60'
      } h-screen bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none transition-all duration-300 ease-in-out`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-slate-200">
          {!isCollapsed ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-slate-900">
                  Stock<span className="text-slate-400 font-light">·</span>tock
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                  v1
                </span>
              </div>
              <span className="text-[11px] text-slate-600 font-medium tracking-tight">
                Control Comercial
              </span>
            </div>
          ) : (
            <div className="mx-auto font-bold text-xs tracking-tight text-slate-900">
              ST
            </div>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Search quick button */}
        <div className="px-2.5 pt-3 pb-2">
          {!isCollapsed ? (
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Buscar en el sistema (Atajo Ctrl+K)"
              className="w-full h-8 px-2.5 rounded bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center justify-between hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span className="text-xs font-normal text-slate-600">Buscar...</span>
              </span>
              <kbd className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-sans font-semibold shadow-2xs">
                ⌘K
              </kbd>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Buscar en el sistema"
              title="Buscar (Ctrl+K)"
              className="w-full h-8 rounded bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
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
                title={isCollapsed ? item.name : undefined}
                aria-current={isActive ? 'page' : undefined}
                onMouseEnter={() => handlePrefetch(item.href)}
                onFocus={() => handlePrefetch(item.href)}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center px-0 py-2' : 'justify-between px-2.5 py-1.5'
                } rounded text-xs font-medium transition-colors ${
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
                  {!isCollapsed && <span>{item.name}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-sans font-medium bg-slate-200 text-slate-800">
                    {item.badge}
                  </span>
                )}
                {isCollapsed && item.badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 absolute top-1.5 right-1.5" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Status footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50">
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-[11px] text-slate-700">
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"
              />
              <span className="font-semibold text-slate-800">Sistema Conectado</span>
            </div>
            <span className="text-[10px] text-slate-600 font-medium">PostgreSQL</span>
          </div>
        ) : (
          <div className="flex justify-center" title="Sistema Conectado (PostgreSQL)">
            <span
              aria-hidden="true"
              className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
