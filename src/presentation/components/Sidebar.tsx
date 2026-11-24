import React, { useState } from 'react';
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
  ArrowRightLeft,
  LucideIcon,
} from 'lucide-react';
import { useUserRole } from '@/utils/security/UserRoleContext';
import { OperatorSwitcherModal } from '@/presentation/components/OperatorSwitcherModal';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

const navigationItems: NavItem[] = [
  { name: 'Dashboard',         href: '/',             icon: LayoutDashboard },
  { name: 'Catálogo',          href: '/productos',    icon: Package },
  { name: 'Inventario',        href: '/inventario',   icon: Boxes },
  { name: 'Pedidos',           href: '/pedidos',      icon: ShoppingBag },
  { name: 'Ventas',            href: '/ventas',       icon: Receipt },
  { name: 'Compras',           href: '/compras',      icon: Truck },
  { name: 'Clientes & Prov.',  href: '/contactos',    icon: Users },
  { name: 'Alertas',           href: '/alertas',      icon: AlertTriangle },
  { name: 'Configuración',     href: '/configuracion',icon: Settings },
];

const prefetchMap: Record<string, () => Promise<unknown>> = {
  '/':              () => import('@/pages/DashboardPage'),
  '/productos':     () => import('@/pages/ProductsPage'),
  '/inventario':    () => import('@/pages/InventoryPage'),
  '/pedidos':       () => import('@/pages/OrdersPage'),
  '/ventas':        () => import('@/pages/SalesPage'),
  '/compras':       () => import('@/pages/PurchasesPage'),
  '/contactos':     () => import('@/pages/ContactsPage'),
  '/alertas':       () => import('@/pages/AlertsPage'),
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
  const { currentUser, permissions } = useUserRole();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const handlePrefetch = (href: string) => {
    try { prefetchMap[href]?.(); } catch { /* silent */ }
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  const filteredNavItems = navigationItems.filter((item) => {
    if (item.href === '/compras' && !permissions.canAccessPurchases) return false;
    if (item.href === '/ventas' && !permissions.canMakeSales) return false;
    if (item.href === '/configuracion' && !permissions.canAccessSettings) return false;
    return true;
  });

  return (
    <aside
      aria-label="Barra lateral del sistema"
      className={`${
        isCollapsed ? 'w-[52px]' : 'w-[220px]'
      } h-screen bg-white border-r border-slate-200 flex flex-col shrink-0 select-none transition-[width] duration-200 ease-in-out overflow-hidden`}
    >
      {/* ── Encabezado ──────────────────────────────────── */}
      <div className="h-14 flex items-center border-b border-slate-100 shrink-0 px-3">
        {!isCollapsed ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-extrabold tracking-tight text-slate-900">
                Stock<span className="text-lime-500 font-black">·</span>tock
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-1">Control Comercial</span>
            </div>

            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Colapsar menú"
              title="Colapsar menú (Ctrl+B)"
              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <PanelLeftClose className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Expandir menú"
              title="Expandir menú"
              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* ── Búsqueda ─────────────────────────────────────── */}
      <div className="px-2 pt-2.5 pb-1.5 shrink-0">
        {!isCollapsed ? (
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Buscar (Ctrl+K)"
            className="w-full h-8 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" aria-hidden="true" />
              <span className="text-[11px] text-slate-400 truncate">Buscar...</span>
            </span>
            <kbd className="text-[9px] bg-white border border-slate-200 text-slate-400 px-1 py-px rounded font-sans font-medium leading-none shrink-0">
              {isMac ? '⌘K' : '⌃K'}
            </kbd>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Buscar"
            title={isMac ? 'Buscar (⌘K)' : 'Buscar (Ctrl+K)'}
            className="w-8 h-8 mx-auto rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* ── Navegación ───────────────────────────────────── */}
      <nav aria-label="Navegación principal" className="flex-1 px-2 py-1 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          if (isCollapsed) {
            return (
              <Link
                key={item.name}
                to={item.href}
                title={item.name}
                aria-current={isActive ? 'page' : undefined}
                onMouseEnter={() => handlePrefetch(item.href)}
                onFocus={() => handlePrefetch(item.href)}
                className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center transition-all relative ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs ring-1 ring-lime-500/60'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-400 absolute top-1 right-1" />
                )}
                {!isActive && item.badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 absolute top-1 right-1" />
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
              className={`h-8 w-full px-2.5 rounded-lg flex items-center justify-between gap-2.5 transition-all ${
                isActive
                  ? 'bg-slate-900 text-white font-medium shadow-2xs border-l-2 border-lime-500 pl-2'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  aria-hidden="true"
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}
                />
                <span className={`text-[12px] truncate ${isActive ? 'text-white' : 'text-slate-700'}`}>
                  {item.name}
                </span>
              </div>
              {item.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                  isActive ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Operador & Rol Activo ────────────────────────── */}
      <div className="p-2 border-t border-slate-100 shrink-0">
        {!isCollapsed ? (
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(true)}
            className="w-full p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100 flex items-center justify-between transition-all cursor-pointer text-left group"
            title="Cambiar de Operador o Turno"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-6 h-6 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs`}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-900 block truncate leading-tight group-hover:text-slate-900 transition-colors">
                  {currentUser.name}
                </span>
                <span className="text-[9px] font-semibold text-slate-500 uppercase font-mono block leading-none mt-0.5">
                  {currentUser.role === 'ADMIN' ? 'Admin' : currentUser.role === 'CASHIER' ? 'Cajero' : 'Depósito'}
                </span>
              </div>
            </div>
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(true)}
            className={`w-8 h-8 mx-auto rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center text-[11px] font-bold cursor-pointer hover:ring-2 hover:ring-lime-400 transition-all shadow-2xs`}
            title={`Operador: ${currentUser.name} (${currentUser.role}). Clic para cambiar.`}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </button>
        )}
      </div>

      {/* Modal selector de operador */}
      <OperatorSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
      />
    </aside>
  );
}
