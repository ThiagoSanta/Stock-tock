import React, { useState } from 'react';
import { X, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Purchase } from '@/core/domain/purchases/types';

interface PurchaseDetailModalProps {
  purchase: Purchase | null;
  onClose: () => void;
  onReceive: (purchaseId: string) => Promise<void>;
}

export function PurchaseDetailModal({
  purchase,
  onClose,
  onReceive,
}: PurchaseDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!purchase) return null;

  const handleReceive = async () => {
    setLoading(true);
    setError(null);
    try {
      await onReceive(purchase.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al recibir la compra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-lg bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
              {purchase.purchaseNumber}
            </span>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Detalle de Orden de Compra
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 p-3 rounded bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Proveedor</span>
              <span className="font-medium text-slate-900">{purchase.supplierName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Fecha de Emisión</span>
              <span className="font-mono text-slate-700">
                {new Date(purchase.createdAt).toLocaleString('es-AR')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Estado de Orden</span>
              <span className="font-medium text-slate-900">{purchase.status}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Monto Total Compra</span>
              <span className="font-mono font-bold text-slate-900">
                ${purchase.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wider block">
              Ítems Ordenados ({purchase.items.length})
            </span>
            <div className="rounded border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">Producto</th>
                    <th className="py-2 px-3 text-center">Cant. Pedida</th>
                    <th className="py-2 px-3 text-right">Costo Unit.</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchase.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2 px-3 font-medium text-slate-900">{it.productName}</td>
                      <td className="py-2 px-3 text-center font-mono text-slate-700">
                        {it.quantityOrdered} un.
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        ${it.unitCost.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        ${it.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              onClick={onClose}
              className="h-8 px-3 rounded bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            {purchase.status === 'EMITIDA' && (
              <button
                onClick={handleReceive}
                disabled={loading}
                className="h-8 px-4 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Recibir en Depósito & Recalcular PPP</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
