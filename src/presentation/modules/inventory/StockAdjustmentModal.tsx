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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <div
              aria-hidden="true"
              className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
            <h3
              id="adjust-modal-title"
              className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider"
            >
              Ajuste Manual de Inventario
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de ajuste"
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {error && (
            <div
              role="alert"
              className="p-3 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 font-medium"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="adjust-product" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Producto a Ajustar *
            </label>
            <select
              id="adjust-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full h-8 px-2 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            >
              {stockList.map((item) => (
                <option key={item.productId} value={item.productId}>
                  {item.productName} (SKU: {item.sku} • Stock Físico: {item.physicalStock} un.)
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Tipo de Movimiento *
            </span>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo de ajuste">
              <button
                type="button"
                aria-pressed={type === 'INGRESO_AJUSTE'}
                onClick={() => setType('INGRESO_AJUSTE')}
                className={`h-8 px-3 rounded border text-xs font-semibold transition-all cursor-pointer ${
                  type === 'INGRESO_AJUSTE'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                + Ingreso / Sobrante
              </button>
              <button
                type="button"
                aria-pressed={type === 'SALIDA_AJUSTE'}
                onClick={() => setType('SALIDA_AJUSTE')}
                className={`h-8 px-3 rounded border text-xs font-semibold transition-all cursor-pointer ${
                  type === 'SALIDA_AJUSTE'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-300 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                - Salida / Merma / Rotura
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="adjust-quantity" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Cantidad de Unidades *
            </label>
            <input
              id="adjust-quantity"
              type="number"
              min="0.01"
              step="any"
              required
              aria-required="true"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          {/* Live impact simulation */}
          <div className="p-3.5 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
              Simulación de Impacto Inmediato
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">Stock Físico:</span>
              <div className="flex items-center gap-1.5 font-mono tabular-nums">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">{currentPhysical} un.</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
                <span
                  className={`font-bold ${
                    type === 'INGRESO_AJUSTE' ? 'text-emerald-800 dark:text-emerald-300' : 'text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  {resultingPhysical} un.
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">Stock Disponible:</span>
              <div className="flex items-center gap-1.5 font-mono tabular-nums">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">{currentAvailable} un.</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
                <span
                  className={`font-bold ${
                    isInvalidNegative ? 'text-rose-800 dark:text-rose-300' : 'text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  {resultingAvailable} un.
                </span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="adjust-reason" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Motivo del Ajuste (Auditoría) *
            </label>
            <textarea
              id="adjust-reason"
              required
              aria-required="true"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Conteo físico semestral, mercadería dañada durante traslado..."
              className="w-full p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none placeholder:text-zinc-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-8 px-3 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:bg-zinc-300 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || isInvalidNegative}
              className="h-8 px-4 rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 active:bg-zinc-950 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs focus-visible:ring-2 focus-visible:ring-zinc-900"
            >
              {loading ? 'Asentando...' : 'Confirmar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
