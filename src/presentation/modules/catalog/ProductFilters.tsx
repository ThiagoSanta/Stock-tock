'use client';

import React from 'react';
import { Search, Plus, Filter } from 'lucide-react';

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
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre, SKU o código de barras..."
          className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#141518] border border-[#27272a] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#84cc16] transition-colors"
        />
      </div>

      {/* Filter Tabs & New Product Button */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        <div className="flex items-center p-1 rounded-lg bg-[#141518] border border-[#27272a] text-xs shrink-0">
          <button
            onClick={() => onFilterChange('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              stockFilter === 'ALL'
                ? 'bg-[#22242a] text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => onFilterChange('NORMAL')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              stockFilter === 'NORMAL'
                ? 'bg-[#22242a] text-[#84cc16]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Stock Normal
          </button>
          <button
            onClick={() => onFilterChange('LOW')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              stockFilter === 'LOW'
                ? 'bg-[#22242a] text-amber-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Bajo Mínimo
          </button>
          <button
            onClick={() => onFilterChange('OUT')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              stockFilter === 'OUT'
                ? 'bg-[#22242a] text-rose-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Agotados
          </button>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="h-9 px-3.5 rounded-lg bg-[#84cc16] hover:bg-[#74b412] text-black text-xs font-semibold shadow-[0_0_15px_rgba(132,204,22,0.25)] transition-all flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Producto</span>
        </button>
      </div>
    </div>
  );
}
