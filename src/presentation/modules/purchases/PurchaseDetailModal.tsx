'use client';

import React, { useState } from 'react';
import { X, Truck, CheckCircle2, AlertCircle, TrendingDown } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-[#121214] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 px-6 border-b border-[#222226] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono font-bold text-xs">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Orden de Compra <span className="font-mono text-[#84cc16]">{purchase.purchaseNumber}</span>
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
              <span className="text-[11px] text-zinc-500 block">Proveedor</span>
              <span className="font-medium text-zinc-100">{purchase.supplierName}</span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 block">Estado Actual</span>
              <span className="font-mono font-semibold text-[#84cc16]">{purchase.status}</span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 block">Fecha Emisión</span>
              <span className="text-zinc-300 font-mono text-[11px]">
                {new Date(purchase.createdAt).toLocaleString('es-AR')}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 block">Total Inversión</span>
              <span className="font-mono font-bold text-zinc-100">
                ${purchase.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
              {purchase.items.map((it) => (
                <div key={it.id} className="pt-2 first:pt-0 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-zinc-200">{it.productName}</p>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {it.quantityOrdered} un. solicitadas × ${it.unitCost.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-zinc-100">
                    ${it.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Impact Banner if EMITIDA */}
          {purchase.status === 'EMITIDA' && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-2">
              <TrendingDown className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Al confirmar la recepción se sumarán las unidades al stock físico y el sistema recalculará automáticamente el <strong>Costo Promedio Ponderado (PPP)</strong> del producto.
              </span>
            </div>
          )}

          {/* Action Buttons based on status */}
          <div className="pt-4 border-t border-[#222226] flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-lg bg-[#18181b] hover:bg-[#202024] text-zinc-300 text-xs font-medium"
            >
              Cerrar
            </button>

            {purchase.status === 'EMITIDA' && (
              <button
                onClick={handleReceive}
                disabled={loading}
                className="h-9 px-5 rounded-lg bg-[#84cc16] hover:bg-[#74b412] text-black text-xs font-bold shadow-[0_0_15px_rgba(132,204,22,0.25)] flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Ingresando stock...' : 'Confirmar Recepción de Mercadería'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
