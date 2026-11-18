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
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs">
        <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Cargando existencias...</p>
      </div>
    );
  }

  if (stockList.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs">
        <p className="text-xs text-slate-500">No hay productos con existencias registradas.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-2.5 px-3">Producto & SKU</th>
              <th className="py-2.5 px-3">Depósito</th>
              <th className="py-2.5 px-3 text-center">Físico</th>
              <th className="py-2.5 px-3 text-center">Reservado</th>
              <th className="py-2.5 px-3 text-center">Disponible</th>
              <th className="py-2.5 px-3 text-right">Valuación Total</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
              <th className="py-2.5 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stockList.map((item) => {
              const isOut = item.availableStock <= 0;
              const isLow = item.availableStock <= item.minStockAlert && !isOut;

              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3">
                    <span className="font-medium text-slate-900 block">{item.productName}</span>
                    <span className="font-mono text-[10px] text-slate-400">SKU: {item.sku}</span>
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                    {item.warehouseName}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-medium text-slate-800">
                    {item.physicalStock}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">
                    {item.reservedStock}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                    {item.availableStock}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-medium text-slate-700">
                    ${item.totalValuation.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                        isOut
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isLow
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isOut ? (
                        <>
                          <PackageX className="w-2.5 h-2.5" /> Quiebre
                        </>
                      ) : isLow ? (
                        <>
                          <AlertTriangle className="w-2.5 h-2.5" /> Bajo
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5" /> Óptimo
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => onOpenAdjustModal(item)}
                      className="px-2 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
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
