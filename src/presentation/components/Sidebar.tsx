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

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <aside
      aria-label="Barra lateral del sistema"
      className={`${
        isCollapsed ? 'w-16' : 'w-56'
      } h-screen bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 select-none transition-all duration-200 ease-in-out`}
    >
      <div className="flex flex-col min-h-0">
        {/* Header de la marca y toggle */}
        <div className="h-14 flex items-center px-3 border-b border-slate-100 shrink-0">
          {!isCollapsed ? (
            <div className="w-full flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-bold text-[15px] tracking-tight text-slate-900">
                    Stock<span className="text-slate-400 font-light">·</span>tock
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80">
                    v1
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-normal mt-1 leading-none">
                  Control Comercial
                </span>
              </div>

              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Colapsar barra lateral"
                className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Colapsar menú"
              >
                <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Expandir barra lateral"
                className="w-8 h-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Expandir menú"
              >
                <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Botón de búsqueda */}
        <div className="px-2.5 pt-3 pb-2 shrink-0">
          {!isCollapsed ? (
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Buscar en el sistema (Ctrl+K)"
              className="w-full h-8 px-2.5 rounded-md bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 text-slate-500 text-xs flex items-center justify-between transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" aria-hidden="true" />
                <span className="text-xs text-slate-500 group-hover:text-slate-700">Buscar...</span>
              </span>
              <kbd className="text-[10px] bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-sans font-medium shadow-2xs">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Buscar en el sistema"
              title={isMac ? 'Buscar (⌘K)' : 'Buscar (Ctrl+K)'}
              className="w-9 h-9 mx-auto rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Navegación */}
        <nav aria-label="Navegación principal" className="px-2.5 py-1 space-y-0.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

            if (isCollapsed) {
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={item.name}
                  aria-current={isActive ? 'page' : undefined}
                  onMouseEnter={() => handlePrefetch(item.href)}
                  onFocus={() => handlePrefetch(item.href)}
                  className={`w-9 h-9 mx-auto rounded-md flex items-center justify-center transition-colors relative ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    aria-hidden="true"
                    className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-500'}`}
                  />
                  {item.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900 absolute top-1.5 right-1.5" />
                  )}
                </Link>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                aria-current={isActive ? 'page' : undefined}
                onMouseEnter={() => handlePrefetch(item.href)}
                onFocus={() => handlePrefetch(item.href)}
                className={`h-8.5 px-2.5 rounded-md flex items-center justify-between text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    aria-hidden="true"
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-slate-900' : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-sans font-medium bg-slate-200/80 text-slate-700 shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer de Estado del Sistema */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span className="font-medium text-slate-700">Base de datos</span>
            </div>
            <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
              En línea
            </span>
          </div>
        ) : (
          <div
            className="w-9 h-9 mx-auto flex items-center justify-center cursor-help"
            title="Base de datos PostgreSQL en línea"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
