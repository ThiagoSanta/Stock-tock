import React from 'react';
import { InventoryStockDetailed } from '@/core/application/ports/IInventoryRepository';
import { CheckCircle2, AlertTriangle, PackageX } from 'lucide-react';

interface InventoryStockTableProps {
  stockList: InventoryStockDetailed[];
  loading: boolean;
  onOpenAdjustModal: (item?: InventoryStockDetailed) => void;
}

export function InventoryStockTable({
  stockList,
  loading,
  onOpenAdjustModal,
}: InventoryStockTableProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="p-8 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs"
      >
        <div
          aria-hidden="true"
          className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"
        />
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Cargando existencias en depósitos...</p>
      </div>
    );
  }

  if (stockList.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">No hay productos con existencias registradas.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Stock físico, reservado, disponible y valuación por depósito</caption>
          <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th scope="col" className="py-3 px-3">Producto & SKU</th>
              <th scope="col" className="py-3 px-3">Depósito</th>
              <th scope="col" className="py-3 px-3 text-center">Físico</th>
              <th scope="col" className="py-3 px-3 text-center">Reservado</th>
              <th scope="col" className="py-3 px-3 text-center">Disponible</th>
              <th scope="col" className="py-3 px-3 text-right">Valuación Total</th>
              <th scope="col" className="py-3 px-3 text-center">Estado</th>
              <th scope="col" className="py-3 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {stockList.map((item) => {
              const isOut = item.availableStock <= 0;
              const isLow = item.availableStock <= item.minStockAlert && !isOut;

              return (
                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">{item.productName}</span>
                    <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">SKU: {item.sku}</span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                    {item.warehouseName}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                    {item.physicalStock}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-zinc-600 dark:text-zinc-400 tabular-nums">
                    {item.reservedStock}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {item.availableStock}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    ${item.totalValuation.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                        isOut
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/70'
                          : isLow
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/70'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70'
                      }`}
                    >
                      {isOut ? (
                        <>
                          <PackageX className="w-3 h-3" aria-hidden="true" /> Quiebre
                        </>
                      ) : isLow ? (
                        <>
                          <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Bajo
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Óptimo
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      aria-label={`Ajustar stock de ${item.productName}`}
                      onClick={() => onOpenAdjustModal(item)}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:bg-zinc-300 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-zinc-900"
                    >
                      Ajustar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
