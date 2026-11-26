import React from 'react';
import { Search, Plus, Printer, Upload, Tag, Percent, ArrowUpDown } from 'lucide-react';

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  stockFilter: 'ALL' | 'NORMAL' | 'LOW' | 'OUT';
  onFilterChange: (filter: 'ALL' | 'NORMAL' | 'LOW' | 'OUT') => void;
  onOpenCreateModal: () => void;
  onOpenPriceList?: () => void;
  onOpenImportModal?: () => void;
  onOpenLabels?: () => void;
  onOpenBulkPriceUpdate?: () => void;
  onOpenCostComparison?: () => void;
}

export function ProductFilters({
  searchTerm,
  onSearchChange,
  stockFilter,
  onFilterChange,
  onOpenCreateModal,
  onOpenPriceList,
  onOpenImportModal,
  onOpenLabels,
  onOpenBulkPriceUpdate,
  onOpenCostComparison,
}: ProductFiltersProps) {
  return (
    <div className="space-y-2.5">
      {/* Fila 1: Buscador + Tabs de Stock + Nuevo Producto */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="catalog-search" className="sr-only">
            Buscar productos por nombre, SKU o código de barras
          </label>
          <Search
            className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
            aria-hidden="true"
          />
          <input
            id="catalog-search"
            type="search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, SKU o código de barras..."
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:outline-none focus:border-lime-500 dark:focus:border-lime-400 transition-colors shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label="Filtrar por nivel de stock"
            className="flex flex-wrap items-center p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={stockFilter === 'ALL'}
              onClick={() => onFilterChange('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                stockFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs ring-1 ring-lime-500/40'
                  : 'text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={stockFilter === 'NORMAL'}
              onClick={() => onFilterChange('NORMAL')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                stockFilter === 'NORMAL'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-800 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Stock Normal
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={stockFilter === 'LOW'}
              onClick={() => onFilterChange('LOW')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                stockFilter === 'LOW'
                  ? 'bg-white dark:bg-zinc-800 text-amber-800 dark:text-amber-400 shadow-xs'
                  : 'text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Bajo Stock
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={stockFilter === 'OUT'}
              onClick={() => onFilterChange('OUT')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                stockFilter === 'OUT'
                  ? 'bg-white dark:bg-zinc-800 text-rose-800 dark:text-rose-400 shadow-xs'
                  : 'text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Quiebre (0)
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="h-8 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs border border-transparent focus-visible:ring-2 focus-visible:ring-lime-500"
          >
            <Plus className="w-4 h-4 text-lime-400 dark:text-lime-600" aria-hidden="true" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Fila 2: Herramientas del Catálogo (envueltas sin scroll horizontal) */}
      {(onOpenPriceList || onOpenImportModal || onOpenLabels || onOpenBulkPriceUpdate || onOpenCostComparison) && (
        <div className="flex flex-wrap items-center gap-2">
          {onOpenPriceList && (
            <button
              type="button"
              onClick={onOpenPriceList}
              title="Generar e imprimir Lista de Precios en A4"
              className="h-8 px-2.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Lista de Precios A4</span>
            </button>
          )}

          {onOpenImportModal && (
            <button
              type="button"
              onClick={onOpenImportModal}
              title="Importar catálogo masivo desde planilla CSV"
              className="h-8 px-2.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Importar CSV</span>
            </button>
          )}

          {onOpenLabels && (
            <button
              type="button"
              onClick={onOpenLabels}
              title="Generar etiquetas de código de barras para imprimir en A4"
              className="h-8 px-2.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Tag className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Etiquetas A4</span>
            </button>
          )}

          {onOpenBulkPriceUpdate && (
            <button
              type="button"
              onClick={onOpenBulkPriceUpdate}
              title="Ajuste masivo de precios por porcentaje"
              className="h-8 px-2.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Percent className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Aumento Masivo %</span>
            </button>
          )}

          {onOpenCostComparison && (
            <button
              type="button"
              onClick={onOpenCostComparison}
              title="Comparativa de costos entre proveedores"
              className="h-8 px-2.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Comparar Costos</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
