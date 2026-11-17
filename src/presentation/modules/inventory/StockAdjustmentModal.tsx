'use client';

import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, AlertTriangle, ArrowRight } from 'lucide-react';
import { InventoryStockDetailed, AdjustStockDTO } from '@/core/application/ports/IInventoryRepository';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockList: InventoryStockDetailed[];
  selectedItem?: InventoryStockDetailed;
  onConfirmAdjust: (dto: Omit<AdjustStockDTO, 'companyId' | 'warehouseId'>) => Promise<void>;
}

export function StockAdjustmentModal({
  isOpen,
  onClose,
  stockList,
  selectedItem,
  onConfirmAdjust,
}: StockAdjustmentModalProps) {
  const [productId, setProductId] = useState('');
  const [type, setType] = useState<'INGRESO_AJUSTE' | 'SALIDA_AJUSTE'>('INGRESO_AJUSTE');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedItem) {
      setProductId(selectedItem.productId);
    } else if (stockList.length > 0 && !productId) {
      setProductId(stockList[0].productId);
    }
  }, [selectedItem, stockList, productId]);

  if (!isOpen) return null;

  const currentProduct = stockList.find((s) => s.productId === productId);
  const numQty = parseFloat(quantity) || 0;

  const currentPhysical = currentProduct ? currentProduct.physicalStock : 0;
  const currentAvailable = currentProduct ? currentProduct.availableStock : 0;

  const resultingPhysical =
    type === 'INGRESO_AJUSTE' ? currentPhysical + numQty : currentPhysical - numQty;
  const resultingAvailable =
    type === 'INGRESO_AJUSTE' ? currentAvailable + numQty : currentAvailable - numQty;

  const isInvalidNegative = type === 'SALIDA_AJUSTE' && numQty > currentAvailable;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setError('Debes seleccionar un producto.');
      return;
    }
    if (numQty <= 0) {
      setError('La cantidad debe ser mayor a 0.');
      return;
    }
    if (isInvalidNegative) {
      setError('No puedes descontar más unidades de las disponibles en inventario.');
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      setError('El motivo del ajuste es obligatorio (mínimo 5 caracteres).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirmAdjust({
        productId,
        type,
        quantity: numQty,
        reason: reason.trim(),
      });
      setReason('');
      setQuantity('1');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el ajuste.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-[#121214] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 px-6 border-b border-[#222226] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">Ajuste Manual de Inventario</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-[#1a1a1e]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Producto */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Producto a Ajustar *
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
            >
              {stockList.map((item) => (
                <option key={item.productId} value={item.productId}>
                  {item.productName} (SKU: {item.sku} • Stock Físico: {item.physicalStock} un.)
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Ajuste */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('INGRESO_AJUSTE')}
                className={`h-9 px-3 rounded-lg border text-xs font-medium transition-all ${
                  type === 'INGRESO_AJUSTE'
                    ? 'bg-[#84cc16]/15 border-[#84cc16] text-[#84cc16]'
                    : 'bg-[#18181b] border-[#27272a] text-zinc-400'
                }`}
              >
                + Ingreso / Sobrante
              </button>
              <button
                type="button"
                onClick={() => setType('SALIDA_AJUSTE')}
                className={`h-9 px-3 rounded-lg border text-xs font-medium transition-all ${
                  type === 'SALIDA_AJUSTE'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-400'
                    : 'bg-[#18181b] border-[#27272a] text-zinc-400'
                }`}
              >
                - Salida / Merma / Rotura
              </button>
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Cantidad a Ajustar *
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs font-mono text-zinc-100 focus:outline-none focus:border-[#84cc16]"
            />
          </div>

          {/* Simulación de Impacto en Stock */}
          <div className="p-3.5 rounded-xl bg-[#161619] border border-[#27272a] space-y-1.5 text-xs">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Simulación de Saldo Resultante
            </span>
            <div className="flex items-center justify-between font-mono">
              <span className="text-zinc-400">
                Físico actual: <strong className="text-zinc-200">{currentPhysical}</strong>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-zinc-200 font-bold">
                Nuevo Físico:{' '}
                <span className={type === 'SALIDA_AJUSTE' ? 'text-rose-400' : 'text-[#84cc16]'}>
                  {resultingPhysical} un.
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-zinc-500">Disp: {currentAvailable} un.</span>
              <span className="text-zinc-400">
                Nuevo Disp:{' '}
                <strong className={isInvalidNegative ? 'text-rose-500' : 'text-[#84cc16]'}>
                  {resultingAvailable} un.
                </strong>
              </span>
            </div>
          </div>

          {/* Motivo Obligatorio */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Motivo del Ajuste (Obligatorio para Auditoría) *
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Recuento físico mensual / Merma por daño en embalaje..."
              className="w-full p-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#84cc16]"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#222226] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg bg-[#18181b] hover:bg-[#202024] text-xs font-medium text-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || isInvalidNegative}
              className="h-9 px-5 rounded-lg bg-[#84cc16] hover:bg-[#74b412] disabled:opacity-40 text-black text-xs font-bold shadow-sm"
            >
              {loading ? 'Guardando...' : 'Aplicar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
