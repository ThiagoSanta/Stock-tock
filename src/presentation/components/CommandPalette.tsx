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
  CornerDownLeft,
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
        description: 'Métricas comerciales, movimientos recientes y estado del negocio',
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
        description: 'Datos de la empresa, depósitos y copias de seguridad',
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
        description: 'Abrir mostrador de cobro con lector de código de barras',
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
        id: 'action-cash-shift',
        title: 'Arqueo y Cierre de Caja Diario',
        description: 'Control de cobros en efectivo, transferencias y rendición de turno',
        category: 'Acciones Rápidas',
        icon: Receipt,
        keywords: ['caja', 'cierre', 'arqueo', 'efectivo', 'turno', 'rendición'],
        action: () => {
          navigate('/ventas');
          onClose();
        },
      },
      {
        id: 'action-cash-movement',
        title: 'Nuevo Gasto / Movimiento de Caja Chica',
        description: 'Asentar egresos de mostrador (flete, viáticos, limpieza) o aportes',
        category: 'Acciones Rápidas',
        icon: Receipt,
        keywords: ['gasto', 'caja chica', 'egreso', 'flete', 'viático', 'salida dinero'],
        action: () => {
          navigate('/ventas');
          onClose();
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
        id: 'action-transfer-stock',
        title: 'Transferencia entre Depósitos',
        description: 'Mover existencias entre sucursales o depósitos con remito interno',
        category: 'Acciones Rápidas',
        icon: Boxes,
        keywords: ['transferencia', 'depósito', 'sucursal', 'traslado', 'remito'],
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
        id: 'report-reconcile',
        title: 'Conciliación y Conteo Físico',
        description: 'Cargar conteo real y asentar diferencias de stock en lote',
        category: 'Reportes & Auditoría',
        icon: FileSpreadsheet,
        keywords: ['conciliación', 'conteo', 'auditoría', 'sobrantes', 'faltantes', 'cierre', 'kardex'],
        action: () => {
          navigate('/alertas');
          onClose();
        },
      },
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
        id: 'report-backup',
        title: 'Copia de Seguridad Completa (JSON)',
        description: 'Descargar respaldo íntegro de catálogo, kardex, ventas y clientes',
        category: 'Reportes & Auditoría',
        icon: Settings,
        keywords: ['backup', 'copia de seguridad', 'respaldo', 'guardar', 'json', 'descargar'],
        action: () => {
          navigate('/configuracion');
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

  // Agrupar comandos manteniendo el orden para renderizar con encabezados limpios
  let currentCategory = '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda rápida y comandos del sistema"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] px-4 bg-slate-900/30 backdrop-blur-[2px] animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-98 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra del input de búsqueda */}
        <div className="h-11 px-3.5 border-b border-slate-100 flex items-center gap-2.5 bg-white">
          <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribí para buscar módulos, opciones o acciones..."
            className="w-full bg-transparent text-[13px] text-slate-900 placeholder:text-slate-400 border-0 outline-none focus:outline-none focus:ring-0 p-0 shadow-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar buscador"
            className="text-[10px] font-sans font-medium text-slate-400 hover:text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer shrink-0"
          >
            Esc
          </button>
        </div>

        {/* Lista de comandos */}
        <div className="max-h-[380px] overflow-y-auto p-1.5 space-y-0.5">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No se encontraron resultados para <span className="font-semibold text-slate-700">"{query}"</span>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              const showCategoryHeader = !query.trim() && cmd.category !== currentCategory;
              if (showCategoryHeader) {
                currentCategory = cmd.category;
              }

              return (
                <React.Fragment key={cmd.id}>
                  {showCategoryHeader && (
                    <div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {cmd.category}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full px-2.5 py-2 rounded-lg text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'text-slate-900 bg-white border border-slate-200 shadow-2xs'
                            : 'text-slate-400 bg-slate-50 border border-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[12px] truncate ${isSelected ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>
                            {cmd.title}
                          </span>
                          {query.trim() && (
                            <span className="text-[9px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded font-normal">
                              {cmd.category}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate leading-snug">
                          {cmd.description}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 shrink-0 pr-1">
                        <span>Ir</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Footer minimalista */}
        <div className="h-7 px-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-white border border-slate-200 px-1 py-px rounded font-sans leading-none">↑</kbd>
              <kbd className="bg-white border border-slate-200 px-1 py-px rounded font-sans leading-none">↓</kbd>
              <span className="ml-0.5">para navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-white border border-slate-200 px-1 py-px rounded font-sans leading-none">↵</kbd>
              <span className="ml-0.5">para seleccionar</span>
            </span>
          </div>
          <span className="font-medium text-slate-400">Búsqueda global</span>
        </div>
      </div>
    </div>
  );
}
