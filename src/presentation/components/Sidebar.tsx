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
  LogOut,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/utils/security/AuthContext';
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
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  onOpenSearch,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const { signOut } = useAuth();
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
        isCollapsed ? 'md:w-[52px]' : 'md:w-[220px]'
      } w-[220px] fixed inset-y-0 left-0 z-40 md:static h-screen bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0 select-none transition-[width,transform] duration-200 ease-in-out overflow-hidden ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* ── Encabezado ──────────────────────────────────── */}
      <div className="h-14 flex items-center border-b border-zinc-200/80 dark:border-zinc-800 shrink-0 px-3">
        {!isCollapsed ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                Stock<span className="text-lime-500 font-black">·</span>tock
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">Control Comercial</span>
            </div>

            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Colapsar menú"
              title="Colapsar menú (Ctrl+B)"
              className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
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
              className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
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
            className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors shrink-0" aria-hidden="true" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">Buscar...</span>
            </span>
            <kbd className="text-[11px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 px-1 py-px rounded font-sans font-medium leading-none shrink-0">
              {isMac ? '⌘K' : '⌃K'}
            </kbd>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Buscar"
            title={isMac ? 'Buscar (⌘K)' : 'Buscar (Ctrl+K)'}
            className="w-8 h-8 mx-auto rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
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
                    ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 shadow-2xs ring-1 ring-lime-500/80'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-lime-400' : ''}`} aria-hidden="true" />
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-400 absolute top-1 right-1" />
                )}
                {!isActive && item.badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-1 right-1" />
                )}
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => onCloseMobile?.()}
              aria-current={isActive ? 'page' : undefined}
              onMouseEnter={() => handlePrefetch(item.href)}
              onFocus={() => handlePrefetch(item.href)}
              className={`h-8 w-full px-2.5 rounded-lg flex items-center justify-between gap-2.5 transition-all ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 font-medium shadow-2xs border-l-2 border-lime-500 pl-2'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  aria-hidden="true"
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-lime-400' : 'text-zinc-400 dark:text-zinc-500'}`}
                />
                <span className={`text-xs truncate ${isActive ? 'text-white dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {item.name}
                </span>
              </div>
              {item.badge && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Operador & Rol Activo ────────────────────────── */}
      <div className="p-2 border-t border-zinc-200/80 dark:border-zinc-800 shrink-0 space-y-1.5">
        {!isCollapsed ? (
          <>
            <button
              type="button"
              onClick={() => setIsSwitcherOpen(true)}
              className="w-full p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between transition-all cursor-pointer text-left group"
              title="Cambiar de Operador o Turno"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-6 h-6 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center text-[11px] font-bold shrink-0 shadow-2xs`}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block truncate leading-tight transition-colors">
                    {currentUser.name}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase font-mono block leading-none mt-0.5">
                    {currentUser.role === 'ADMIN' ? 'Admin' : currentUser.role === 'CASHIER' ? 'Cajero' : 'Depósito'}
                  </span>
                </div>
              </div>
              <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full h-7 px-2 rounded-lg text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsSwitcherOpen(true)}
              className={`w-8 h-8 mx-auto rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center text-xs font-bold cursor-pointer hover:ring-2 hover:ring-lime-400 transition-all shadow-2xs`}
              title={`Operador: ${currentUser.name} (${currentUser.role}). Clic para cambiar.`}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              title="Cerrar Sesión"
              className="w-8 h-7 mx-auto rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
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
