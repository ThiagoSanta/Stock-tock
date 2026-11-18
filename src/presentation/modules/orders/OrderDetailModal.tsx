import React, { useState } from 'react';
import { X, CheckCircle2, Truck, XCircle, AlertCircle } from 'lucide-react';
import { Order } from '@/core/domain/orders/types';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onConfirm: (orderId: string) => Promise<void>;
  onDispatch: (orderId: string) => Promise<void>;
  onCancel: (orderId: string) => Promise<void>;
}

export function OrderDetailModal({
  order,
  onClose,
  onConfirm,
  onDispatch,
  onCancel,
}: OrderDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;

  const handleAction = async (actionFn: (id: string) => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await actionFn(order.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la acción.');
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
              {order.orderNumber}
            </span>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Detalle del Pedido
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
        <div className="p-4 space-y-3 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Info Card */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Cliente</span>
              <span className="font-medium text-slate-900">{order.customerName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Fecha de Emisión</span>
              <span className="font-mono text-slate-700">
                {new Date(order.createdAt).toLocaleString('es-AR')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Estado Actual</span>
              <span className="font-medium text-slate-900">{order.status}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Monto Total</span>
              <span className="font-mono font-bold text-slate-900">
                ${order.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wider block">
              Ítems del Pedido ({order.items.length})
            </span>
            <div className="rounded border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">Producto</th>
                    <th className="py-2 px-3 text-center">Cant. Solicitada</th>
                    <th className="py-2 px-3 text-right">Precio Unit.</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2 px-3 font-medium text-slate-900">{it.productName}</td>
                      <td className="py-2 px-3 text-center font-mono text-slate-700">
                        {it.quantityRequested} un.
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        ${it.unitPrice.toFixed(2)}
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

          {/* Action Buttons based on status */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {order.status !== 'CANCELADO' && order.status !== 'DESPACHADO_TOTAL' ? (
              <button
                type="button"
                onClick={() => handleAction(onCancel)}
                disabled={loading}
                className="h-8 px-3 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancelar Pedido</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3 rounded bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              {order.status === 'BORRADOR' && (
                <button
                  type="button"
                  onClick={() => handleAction(onConfirm)}
                  disabled={loading}
                  className="h-8 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar y Reservar Stock</span>
                </button>
              )}

              {order.status === 'CONFIRMADO' && (
                <button
                  type="button"
                  onClick={() => handleAction(onDispatch)}
                  disabled={loading}
                  className="h-8 px-4 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Despachar y Descontar Stock</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
