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
      <div className="w-full max-w-xl rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800">
              {purchase.purchaseNumber}
            </span>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Detalle de Orden de Compra
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs">
            <div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase block font-semibold">Proveedor</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{purchase.supplierName}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase block font-semibold">Fecha de Emisión</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {new Date(purchase.createdAt).toLocaleString('es-AR')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase block font-semibold">Estado de Orden</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{purchase.status}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase block font-semibold">Monto Total Compra</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                ${purchase.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block">
              Ítems Ordenados ({purchase.items.length})
            </span>
            <div className="rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">Producto</th>
                    <th className="py-2 px-3 text-center">Cant. Pedida</th>
                    <th className="py-2 px-3 text-right">Costo Unit.</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {purchase.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2 px-3 font-medium text-zinc-900 dark:text-zinc-100">{it.productName}</td>
                      <td className="py-2 px-3 text-center font-mono text-zinc-700 dark:text-zinc-300">
                        {it.quantityOrdered} un.
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                        ${it.unitCost.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        ${it.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={onClose}
              className="h-8 px-3 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
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
