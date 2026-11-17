'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Truck, XCircle, AlertCircle, FileText } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-[#121214] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 px-6 border-b border-[#222226] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center font-mono font-bold text-xs">
              #
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Detalle del Pedido <span className="font-mono text-[#84cc16]">{order.orderNumber}</span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-[#1a1a1e]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#161619] border border-[#222226] text-xs">
            <div>
              <span className="text-[11px] text-zinc-500 block">Cliente</span>
              <span className="font-medium text-zinc-100">{order.customerName}</span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 block">Estado Actual</span>
              <span className="font-mono font-semibold text-[#84cc16]">{order.status}</span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 block">Fecha Creación</span>
              <span className="text-zinc-300 font-mono text-[11px]">
                {new Date(order.createdAt).toLocaleString('es-AR')}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 block">Total del Pedido</span>
              <span className="font-mono font-bold text-zinc-100">
                ${order.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Table of items */}
          <div className="rounded-xl bg-[#161619] border border-[#222226] overflow-hidden text-xs">
            <div className="p-2.5 bg-[#1a1a1e] border-b border-[#222226] font-semibold text-zinc-400 flex justify-between">
              <span>Producto</span>
              <span>Subtotal</span>
            </div>
            <div className="p-3 space-y-2 divide-y divide-[#202026]">
              {order.items.map((it) => (
                <div key={it.id} className="pt-2 first:pt-0 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-zinc-200">{it.productName}</p>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {it.quantityRequested} un. × ${it.unitPrice.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-zinc-100">
                    ${it.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons based on status */}
          <div className="pt-4 border-t border-[#222226] flex items-center justify-between">
            <div>
              {order.status === 'CONFIRMADO' && (
                <span className="text-[11px] text-blue-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mercadería reservada en inventario</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {order.status === 'BORRADOR' && (
                <>
                  <button
                    onClick={() => handleAction(onCancel)}
                    disabled={loading}
                    className="h-9 px-3 rounded-lg bg-[#18181b] hover:bg-[#202024] text-rose-400 text-xs font-medium"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={() => handleAction(onConfirm)}
                    disabled={loading}
                    className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmar (Reservar Stock)</span>
                  </button>
                </>
              )}

              {order.status === 'CONFIRMADO' && (
                <>
                  <button
                    onClick={() => handleAction(onCancel)}
                    disabled={loading}
                    className="h-9 px-3 rounded-lg bg-[#18181b] hover:bg-[#202024] text-rose-400 text-xs font-medium"
                  >
                    Cancelar Pedido
                  </button>
                  <button
                    onClick={() => handleAction(onDispatch)}
                    disabled={loading}
                    className="h-9 px-5 rounded-lg bg-[#84cc16] hover:bg-[#74b412] text-black text-xs font-semibold shadow-[0_0_15px_rgba(132,204,22,0.25)] flex items-center gap-1.5"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Despachar (Asentar Venta)</span>
                  </button>
                </>
              )}

              {(order.status === 'DESPACHADO_TOTAL' || order.status === 'CANCELADO') && (
                <button
                  onClick={onClose}
                  className="h-9 px-4 rounded-lg bg-[#18181b] text-zinc-300 text-xs font-medium"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
