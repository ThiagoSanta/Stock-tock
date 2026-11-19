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
        description: 'Control de operaciones, métricas comerciales y Kardex auditado',
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
        description: 'Ventas directas de mostrador, CMV y márgenes de ganancia',
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
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('stocktock:open-pos'));
          }, 100);
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
        description: 'Dar de alta un nuevo artículo con SKU y precio de venta',
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
        description: 'Emitir orden de compra para reponer existencias con proveedores',
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
        description: 'Descargar archivo con todas las existencias y costos valuados',
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
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra del input de búsqueda */}
        <div className="h-12 px-3.5 border-b border-slate-100 flex items-center gap-2.5 bg-white">
          <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar módulo, función o acción rápida..."
            className="w-full h-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none border-none ring-0 shadow-none px-0"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar buscador"
            className="text-[11px] font-sans font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer shrink-0"
          >
            Esc
          </button>
        </div>

        {/* Lista de comandos */}
        <div className="max-h-[360px] overflow-y-auto p-1.5 space-y-0.5">
          {filteredCommands.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              No se encontraron resultados para <span className="font-semibold text-slate-800">"{query}"</span>
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
                  className={`w-full px-3 py-2 rounded-lg text-left text-xs flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[13px] truncate ${isSelected ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>
                          {cmd.title}
                        </span>
                        <span className="text-[10px] text-slate-600 bg-slate-200/70 px-1.5 py-0.2 rounded font-medium shrink-0">
                          {cmd.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5 font-normal">
                        {cmd.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700 shrink-0">
                      <span>Ir</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer minimalista */}
        <div className="h-8 px-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-white border border-slate-200 px-1 py-0.2 rounded text-[10px] font-sans">↑</kbd>
              <kbd className="bg-white border border-slate-200 px-1 py-0.2 rounded text-[10px] font-sans">↓</kbd>
              <span className="ml-0.5">navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-white border border-slate-200 px-1.5 py-0.2 rounded text-[10px] font-sans">↵</kbd>
              <span className="ml-0.5">seleccionar</span>
            </span>
          </div>
          <span className="text-[10px] font-medium text-slate-600">Búsqueda rápida</span>
        </div>
      </div>
    </div>
  );
}
