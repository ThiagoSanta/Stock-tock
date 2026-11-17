'use client';

import React from 'react';
import { Purchase, PurchaseStatus } from '@/core/domain/purchases/types';
import { Truck, CheckCircle2, XCircle, FileText, ChevronRight } from 'lucide-react';

interface PurchaseTableProps {
  purchases: Purchase[];
  loading: boolean;
  onSelectPurchase: (p: Purchase) => void;
  onReceivePurchase: (purchaseId: string) => void;
}

export function PurchaseTable({
  purchases,
  loading,
  onSelectPurchase,
  onReceivePurchase,
}: PurchaseTableProps) {
  if (loading) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226]">
        <div className="w-6 h-6 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-zinc-400">Cargando órdenes de compra...</p>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226] space-y-2">
        <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
        <h4 className="text-sm font-semibold text-zinc-300">No hay órdenes de compra</h4>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          Generá una orden de compra para abastecer tu inventario y actualizar costos.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: PurchaseStatus) => {
    switch (status) {
      case 'EMITIDA':
      case 'BORRADOR':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Truck className="w-3 h-3" />
            <span>Pendiente de Recepción</span>
          </span>
        );
      case 'RECEPCION_TOTAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#84cc16]/10 text-[#84cc16] border border-[#84cc16]/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Recibida (En Stock)</span>
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            <span>Cancelada</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl bg-[#121214] border border-[#222226] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#161619] border-b border-[#222226] text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-3 px-4">Orden #</th>
              <th className="py-3 px-4">Proveedor</th>
              <th className="py-3 px-4">Ítems a Recibir</th>
              <th className="py-3 px-4 text-right">Total Invertido</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1c1c20]">
            {purchases.map((p) => (
              <tr
                key={p.id}
                onClick={() => onSelectPurchase(p)}
                className="hover:bg-[#16161a] transition-colors cursor-pointer"
              >
                {/* Número y Fecha */}
                <td className="py-3.5 px-4 font-mono font-semibold text-zinc-200">
                  {p.purchaseNumber}
                  <span className="block text-[10px] font-sans text-zinc-500 font-normal">
                    {new Date(p.createdAt).toLocaleDateString('es-AR')}
                  </span>
                </td>

                {/* Proveedor */}
                <td className="py-3.5 px-4">
                  <span className="font-medium text-zinc-100">{p.supplierName}</span>
                </td>

                {/* Ítems */}
                <td className="py-3.5 px-4 text-zinc-400">
                  {p.items.length} producto{p.items.length !== 1 ? 's' : ''} (
                  {p.items.reduce((s, it) => s + it.quantityOrdered, 0)} un.)
                </td>

                {/* Total */}
                <td className="py-3.5 px-4 text-right font-mono font-semibold text-zinc-100">
                  ${p.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>

                {/* Estado */}
                <td className="py-3.5 px-4 text-center">
                  {getStatusBadge(p.status)}
                </td>

                {/* Acciones */}
                <td
                  className="py-3.5 px-4 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    {p.status === 'EMITIDA' && (
                      <button
                        onClick={() => onReceivePurchase(p.id)}
                        className="px-2.5 py-1 rounded bg-[#84cc16]/10 hover:bg-[#84cc16]/20 text-[#84cc16] border border-[#84cc16]/30 font-semibold text-[11px] transition-colors"
                      >
                        Recibir Stock
                      </button>
                    )}
                    <button
                      onClick={() => onSelectPurchase(p)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#202026]"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
