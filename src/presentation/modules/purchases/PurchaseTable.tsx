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
        className="p-8 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs"
      >
        <div
          aria-hidden="true"
          className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"
        />
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Cargando órdenes de compra...</p>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-xs">
        <FileText className="w-6 h-6 text-zinc-400 dark:text-zinc-500 mx-auto mb-2" aria-hidden="true" />
        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">No hay órdenes de compra</h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto font-medium">
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
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/70">
            <Truck className="w-3 h-3" aria-hidden="true" /> Pendiente Recepción
          </span>
        );
      case 'RECEPCION_TOTAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70">
            <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Recibida en Stock
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/70">
            <XCircle className="w-3 h-3" aria-hidden="true" /> Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Listado de órdenes de compra a proveedores</caption>
          <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px] font-bold">
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
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {purchases.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                <td className="py-2.5 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {p.purchaseNumber}
                </td>
                <td className="py-2.5 px-3 font-mono text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">
                  {new Date(p.createdAt).toLocaleDateString('es-AR')}
                </td>
                <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  {p.supplierName}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-zinc-700 dark:text-zinc-300 tabular-nums font-medium">
                  {p.items.length} prod.
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
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
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/70 transition-colors cursor-pointer"
                      >
                        Recibir Stock
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectPurchase(p)}
                      aria-label={`Ver detalle de la orden ${p.purchaseNumber}`}
                      className="p-1 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-zinc-900"
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
