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
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs">
        <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Cargando órdenes de compra...</p>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
        <FileText className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <h4 className="text-xs font-semibold text-slate-900">No hay órdenes de compra</h4>
        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
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
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
            <Truck className="w-2.5 h-2.5" /> Pendiente Recepción
          </span>
        );
      case 'RECEPCION_TOTAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5" /> Recibida en Stock
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">
            <XCircle className="w-2.5 h-2.5" /> Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-lg bg-white border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-2.5 px-3">Orden #</th>
              <th className="py-2.5 px-3">Fecha</th>
              <th className="py-2.5 px-3">Proveedor</th>
              <th className="py-2.5 px-3 text-center">Ítems</th>
              <th className="py-2.5 px-3 text-right">Monto Total</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
              <th className="py-2.5 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchases.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                  {p.purchaseNumber}
                </td>
                <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                  {new Date(p.createdAt).toLocaleDateString('es-AR')}
                </td>
                <td className="py-2 px-3 font-medium text-slate-800">
                  {p.supplierName}
                </td>
                <td className="py-2 px-3 text-center font-mono text-slate-600">
                  {p.items.length} prod.
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                  ${p.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 text-center">
                  {getStatusBadge(p.status)}
                </td>
                <td className="py-2 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {p.status === 'EMITIDA' && (
                      <button
                        onClick={() => onReceivePurchase(p.id)}
                        className="px-2 py-0.5 text-[11px] font-medium rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                      >
                        Recibir Stock
                      </button>
                    )}
                    <button
                      onClick={() => onSelectPurchase(p)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Ver Detalle"
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
