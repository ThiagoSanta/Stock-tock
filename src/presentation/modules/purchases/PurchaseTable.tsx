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
      <div
        role="status"
        aria-live="polite"
        className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs"
      >
        <div
          aria-hidden="true"
          className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"
        />
        <p className="text-xs font-semibold text-slate-700">Cargando órdenes de compra...</p>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
        <FileText className="w-6 h-6 text-slate-400 mx-auto mb-2" aria-hidden="true" />
        <h4 className="text-xs font-bold text-slate-900">No hay órdenes de compra</h4>
        <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
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
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-amber-50 text-amber-900 border-amber-300">
            <Truck className="w-3 h-3" aria-hidden="true" /> Pendiente Recepción
          </span>
        );
      case 'RECEPCION_TOTAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-900 border-emerald-300">
            <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Recibida en Stock
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-rose-50 text-rose-900 border-rose-300">
            <XCircle className="w-3 h-3" aria-hidden="true" /> Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-slate-100 text-slate-800 border-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-lg bg-white border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Listado de órdenes de compra a proveedores</caption>
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th scope="col" className="py-3 px-3">Orden #</th>
              <th scope="col" className="py-3 px-3">Fecha</th>
              <th scope="col" className="py-3 px-3">Proveedor</th>
              <th scope="col" className="py-3 px-3 text-center">Ítems</th>
              <th scope="col" className="py-3 px-3 text-right">Monto Total</th>
              <th scope="col" className="py-3 px-3 text-center">Estado</th>
              <th scope="col" className="py-3 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchases.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-3 font-mono font-bold text-slate-900 tabular-nums">
                  {p.purchaseNumber}
                </td>
                <td className="py-2.5 px-3 font-mono text-xs text-slate-600 tabular-nums">
                  {new Date(p.createdAt).toLocaleDateString('es-AR')}
                </td>
                <td className="py-2.5 px-3 font-semibold text-slate-900">
                  {p.supplierName}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-slate-700 tabular-nums font-medium">
                  {p.items.length} prod.
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                  ${p.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {getStatusBadge(p.status)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {p.status === 'EMITIDA' && (
                      <button
                        type="button"
                        onClick={() => onReceivePurchase(p.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer"
                      >
                        Recibir Stock
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectPurchase(p)}
                      aria-label={`Ver detalle de la orden ${p.purchaseNumber}`}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900"
                    >
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
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
