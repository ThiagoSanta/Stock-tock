import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Receipt,
  Truck,
  Users,
  AlertTriangle,
  Settings,
  Plus,
  SlidersHorizontal,
  FileSpreadsheet,
  ArrowRight,
  X,
  LucideIcon,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: 'Módulos' | 'Acciones Rápidas' | 'Reportes & Auditoría';
  icon: LucideIcon;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPos?: () => void;
}

export function CommandPalette({ isOpen, onClose, onOpenPos }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const commands: CommandItem[] = useMemo(
    () => [
      // Módulos principales
      {
        id: 'nav-dashboard',
        title: 'Dashboard General',
        description: 'Control de operaciones, KPIs comerciales y Kardex reciente',
        category: 'Módulos',
        icon: LayoutDashboard,
        keywords: ['inicio', 'home', 'kpi', 'panel', 'resumen', 'métricas'],
        action: () => {
          navigate('/');
          onClose();
        },
      },
      {
        id: 'nav-catalog',
        title: 'Catálogo de Productos',
        description: 'Gestión de precios, costos PPP, SKUs y códigos de barra',
        category: 'Módulos',
        icon: Package,
        keywords: ['artículos', 'productos', 'precios', 'lista', 'costos', 'ean'],
        action: () => {
          navigate('/productos');
          onClose();
        },
      },
      {
        id: 'nav-inventory',
        title: 'Inventario & Kardex',
        description: 'Existencias físicas, stock disponible y trazabilidad de movimientos',
        category: 'Módulos',
        icon: Boxes,
        keywords: ['stock', 'depósito', 'kardex', 'balance', 'físico', 'disponible', 'valuación'],
        action: () => {
          navigate('/inventario');
          onClose();
        },
      },
      {
        id: 'nav-orders',
        title: 'Pedidos de Clientes',
        description: 'Compromiso de mercadería, reservas y órdenes de despacho',
        category: 'Módulos',
        icon: ShoppingBag,
        keywords: ['pedidos', 'reservas', 'ventas por pedido', 'despacho', 'ordenes'],
        action: () => {
          navigate('/pedidos');
          onClose();
        },
      },
      {
        id: 'nav-sales',
        title: 'Historial de Ventas',
        description: 'Ventas directas de mostrador y facturación con CMV y márgenes',
        category: 'Módulos',
        icon: Receipt,
        keywords: ['ventas', 'tickets', 'facturas', 'mostrador', 'pos', 'cobros'],
        action: () => {
          navigate('/ventas');
          onClose();
        },
      },
      {
        id: 'nav-purchases',
        title: 'Compras a Proveedores',
        description: 'Órdenes de abastecimiento y recálculo de Costo Promedio Ponderado',
        category: 'Módulos',
        icon: Truck,
        keywords: ['compras', 'proveedores', 'ppp', 'recepción', 'ingresos'],
        action: () => {
          navigate('/compras');
          onClose();
        },
      },
      {
        id: 'nav-contacts',
        title: 'Clientes & Proveedores',
        description: 'Directorio fiscal unificado y registro de cuentas comerciales',
        category: 'Módulos',
        icon: Users,
        keywords: ['contactos', 'clientes', 'proveedores', 'cuit', 'directorio'],
        action: () => {
          navigate('/contactos');
          onClose();
        },
      },
      {
        id: 'nav-alerts',
        title: 'Alertas & Reportes',
        description: 'Detección de quiebres, reservas demoradas y planillas de auditoría',
        category: 'Módulos',
        icon: AlertTriangle,
        keywords: ['alertas', 'reportes', 'quiebre', 'conteo', 'auditoría'],
        action: () => {
          navigate('/alertas');
          onClose();
        },
      },
      {
        id: 'nav-settings',
        title: 'Configuración del Sistema',
        description: 'Datos fiscales de la empresa, depósitos y reglas inviolables V1',
        category: 'Módulos',
        icon: Settings,
        keywords: ['configuración', 'empresa', 'depósitos', 'sucursales', 'reglas', 'ajustes'],
        action: () => {
          navigate('/configuracion');
          onClose();
        },
      },

      // Acciones rápidas
      {
        id: 'action-pos',
        title: 'Nueva Venta Rápida (POS)',
        description: 'Abrir mostrador de cobro con pistola de código de barras',
        category: 'Acciones Rápidas',
        icon: Plus,
        keywords: ['cobrar', 'vender', 'mostrador', 'caja', 'ticket', 'pos'],
        action: () => {
          navigate('/');
          onClose();
          if (onOpenPos) onOpenPos();
        },
      },
      {
        id: 'action-adjust-stock',
        title: 'Ajuste Manual de Inventario',
        description: 'Asentar sobrantes, roturas o mermas con justificación de auditoría',
        category: 'Acciones Rápidas',
        icon: SlidersHorizontal,
        keywords: ['ajuste', 'merma', 'rotura', 'sobrante', 'auditoría'],
        action: () => {
          navigate('/inventario');
          onClose();
        },
      },
      {
        id: 'action-new-product',
        title: 'Nuevo Producto en Catálogo',
        description: 'Dar de alta un nuevo artículo con SKU y precio',
        category: 'Acciones Rápidas',
        icon: Plus,
        keywords: ['crear producto', 'alta producto', 'nuevo artículo'],
        action: () => {
          navigate('/productos');
          onClose();
        },
      },
      {
        id: 'action-new-order',
        title: 'Nuevo Pedido de Cliente',
        description: 'Registrar un pedido formal comprometiendo stock disponible',
        category: 'Acciones Rápidas',
        icon: Plus,
        keywords: ['crear pedido', 'nuevo pedido', 'reservar'],
        action: () => {
          navigate('/pedidos');
          onClose();
        },
      },
      {
        id: 'action-new-purchase',
        title: 'Nueva Orden de Compra',
        description: 'Emitir orden de compra para reponer existencias',
        category: 'Acciones Rápidas',
        icon: Plus,
        keywords: ['comprar', 'nueva compra', 'abastecer', 'orden de compra'],
        action: () => {
          navigate('/compras');
          onClose();
        },
      },

      // Reportes & Auditoría
      {
        id: 'report-audit-sheet',
        title: 'Planilla de Conteo Físico',
        description: 'Visualizar e imprimir planilla para auditoría a ciegas en depósito',
        category: 'Reportes & Auditoría',
        icon: FileSpreadsheet,
        keywords: ['planilla', 'conteo', 'imprimir', 'papel', 'inventario ciego'],
        action: () => {
          navigate('/alertas');
          onClose();
        },
      },
      {
        id: 'report-export-csv',
        title: 'Exportar Balance de Inventario (CSV)',
        description: 'Descargar archivo Excel / CSV con todas las existencias y costos',
        category: 'Reportes & Auditoría',
        icon: FileSpreadsheet,
        keywords: ['exportar', 'csv', 'excel', 'descargar'],
        action: () => {
          navigate('/alertas');
          onClose();
        },
      },
    ],
    [navigate, onClose, onOpenPos]
  );

  const filteredCommands = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return commands;

    return commands.filter((cmd) => {
      if (cmd.title.toLowerCase().includes(q)) return true;
      if (cmd.description.toLowerCase().includes(q)) return true;
      if (cmd.keywords?.some((k) => k.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda rápida y comandos del sistema"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="h-13 px-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribí para buscar módulos, opciones o acciones del sistema..."
            className="w-full h-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar buscador"
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
          >
            <kbd className="text-[11px] bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-sans font-medium">
              ESC
            </kbd>
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No se encontraron comandos o pantallas para <span className="font-semibold text-slate-800">"{query}"</span>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full p-2.5 rounded-lg text-left text-xs flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-white border-slate-300 text-slate-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">{cmd.title}</span>
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                          {cmd.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-normal">
                        {cmd.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                      <span>Ir</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="h-9 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="bg-white border border-slate-200 px-1 py-0.5 rounded text-[10px] font-sans font-medium">↑</kbd>{' '}
              <kbd className="bg-white border border-slate-200 px-1 py-0.5 rounded text-[10px] font-sans font-medium">↓</kbd>{' '}
              para navegar
            </span>
            <span>
              <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium">↵</kbd>{' '}
              para seleccionar
            </span>
          </div>
          <span>Búsqueda global</span>
        </div>
      </div>
    </div>
  );
}
