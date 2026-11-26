import React from 'react';
import { Inbox } from 'lucide-react';

export interface DataTableProps {
  caption?: string;
  loading?: boolean;
  loadingText?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  children: React.ReactNode;
}

/** Contenedor de tabla estandarizado con estados de carga, vacío y modo oscuro nativo. */
export function DataTable({
  caption,
  loading = false,
  loadingText = 'Cargando registros...',
  isEmpty = false,
  emptyTitle = 'Sin resultados',
  emptyDescription = 'No hay registros que coincidan con la búsqueda o el filtro aplicado.',
  emptyIcon,
  children,
}: DataTableProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="p-8 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs"
      >
        <div
          aria-hidden="true"
          className="w-5 h-5 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full animate-spin mx-auto mb-2"
        />
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{loadingText}</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="p-8 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-xs">
        <div className="text-zinc-400 dark:text-zinc-500 flex justify-center mb-2" aria-hidden="true">
          {emptyIcon || <Inbox className="w-6 h-6" />}
        </div>
        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{emptyTitle}</h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto font-medium">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {caption && <caption className="sr-only">{caption}</caption>}
          {children}
        </table>
      </div>
    </div>
  );
}
