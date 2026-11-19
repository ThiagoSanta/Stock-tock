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
        className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs"
      >
        <div
          aria-hidden="true"
          className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"
        />
        <p className="text-xs font-semibold text-slate-700">Cargando existencias en depósitos...</p>
      </div>
    );
  }

  if (stockList.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs">
        <p className="text-xs font-medium text-slate-600">No hay productos con existencias registradas.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Stock físico, reservado, disponible y valuación por depósito</caption>
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-bold">
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
          <tbody className="divide-y divide-slate-100">
            {stockList.map((item) => {
              const isOut = item.availableStock <= 0;
              const isLow = item.availableStock <= item.minStockAlert && !isOut;

              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-900 block">{item.productName}</span>
                    <span className="font-mono text-xs text-slate-600">SKU: {item.sku}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-mono text-xs">
                    {item.warehouseName}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800 tabular-nums">
                    {item.physicalStock}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-600 tabular-nums">
                    {item.reservedStock}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 tabular-nums">
                    {item.availableStock}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                    ${item.totalValuation.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                        isOut
                          ? 'bg-rose-50 text-rose-900 border-rose-300'
                          : isLow
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-300'
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
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900"
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
