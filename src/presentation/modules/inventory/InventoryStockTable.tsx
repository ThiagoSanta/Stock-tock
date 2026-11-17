'use client';

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
      <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226]">
        <div className="w-6 h-6 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-zinc-400">Cargando existencias...</p>
      </div>
    );
  }

  if (stockList.length === 0) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226]">
        <p className="text-xs text-zinc-400">No hay productos con existencias registradas.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#121214] border border-[#222226] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#161619] border-b border-[#222226] text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-3 px-4">Producto & SKU</th>
              <th className="py-3 px-4">Depósito</th>
              <th className="py-3 px-4 text-center">Físico</th>
              <th className="py-3 px-4 text-center">Reservado</th>
              <th className="py-3 px-4 text-center">Disponible</th>
              <th className="py-3 px-4 text-right">Valuación Total</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1c1c20]">
            {stockList.map((item) => {
              const isOut = item.availableStock <= 0;
              const isLow = item.availableStock <= item.minStockAlert && !isOut;

              return (
                <tr key={item.id} className="hover:bg-[#16161a] transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-zinc-100 block">{item.productName}</span>
                    <span className="font-mono text-[10px] text-zinc-500">SKU: {item.sku}</span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400">{item.warehouseName}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-medium text-zinc-200">
                    {item.physicalStock} {item.unitOfMeasure}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-zinc-500">
                    {item.reservedStock} {item.unitOfMeasure}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-[#84cc16]">
                    {item.availableStock} {item.unitOfMeasure}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-zinc-100">
                    ${item.totalValuation.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {isOut ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <PackageX className="w-3 h-3" />
                        <span>Agotado</span>
                      </span>
                    ) : isLow ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Bajo Mínimo</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#84cc16]/10 text-[#84cc16] border border-[#84cc16]/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Normal</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onOpenAdjustModal(item)}
                      className="px-2.5 py-1 rounded bg-[#1f2024] hover:bg-[#28282e] text-zinc-300 border border-[#2e2e34] text-[11px] font-medium transition-colors"
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
