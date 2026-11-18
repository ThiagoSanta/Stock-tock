import React from 'react';
import { Search, Plus } from 'lucide-react';

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  stockFilter: 'ALL' | 'NORMAL' | 'LOW' | 'OUT';
  onFilterChange: (filter: 'ALL' | 'NORMAL' | 'LOW' | 'OUT') => void;
  onOpenCreateModal: () => void;
}

export function ProductFilters({
  searchTerm,
  onSearchChange,
  stockFilter,
  onFilterChange,
  onOpenCreateModal,
}: ProductFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre, SKU o código de barras..."
          className="w-full h-8 pl-8 pr-3 rounded bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors shadow-xs"
        />
      </div>

      {/* Filter Tabs & New Product Button */}
      <div className="flex items-center gap-2 overflow-x-auto">
        <div className="flex items-center p-1 rounded-md bg-slate-100 border border-slate-200 text-xs shrink-0">
          <button
            onClick={() => onFilterChange('ALL')}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              stockFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => onFilterChange('NORMAL')}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              stockFilter === 'NORMAL'
                ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stock Normal
          </button>
          <button
            onClick={() => onFilterChange('LOW')}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              stockFilter === 'LOW'
                ? 'bg-white text-amber-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bajo Stock
          </button>
          <button
            onClick={() => onFilterChange('OUT')}
            className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
              stockFilter === 'OUT'
                ? 'bg-white text-rose-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Quiebre (0)
          </button>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>
    </div>
  );
}
