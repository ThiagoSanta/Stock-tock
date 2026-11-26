import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Printer,
  Building2,
} from 'lucide-react';
import { InventoryStockDetailed } from '@/core/application/ports/IInventoryRepository';
import { WarehouseSettings } from '@/core/domain/settings/types';

interface TransferStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockList: InventoryStockDetailed[];
  warehouses: WarehouseSettings[];
  companyId: string;
  onConfirmTransfer: (data: {
    originWarehouseId: string;
    destinationWarehouseId: string;
    productId: string;
    quantity: number;
    reason: string;
  }) => Promise<{ transferNumber: string }>;
}

export function TransferStockModal({
  isOpen,
  onClose,
  stockList,
  warehouses,
  companyId,
  onConfirmTransfer,
}: TransferStockModalProps) {
  const [originWarehouseId, setOriginWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Transferencia de mercadería entre depósitos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<{
    transferNumber: string;
    productName: string;
    quantity: number;
    originName: string;
    destName: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTransferSuccess(null);
      setQuantity('');

      // Establecer depósitos por defecto
      if (warehouses.length > 0) {
        const defaultWh = warehouses.find((w) => w.isDefault) || warehouses[0];
        setOriginWarehouseId(defaultWh.id);
        const otherWh = warehouses.find((w) => w.id !== defaultWh.id);
        if (otherWh) setDestinationWarehouseId(otherWh.id);
      }
    }
  }, [isOpen, warehouses]);

  if (!isOpen) return null;

  // Filtrar stock disponible del depósito de origen seleccionado
  const availableProductsInOrigin = stockList.filter(
    (s) => s.warehouseId === originWarehouseId && s.availableStock > 0
  );

  const selectedStockItem = stockList.find(
    (s) => s.productId === selectedProductId && s.warehouseId === originWarehouseId
  );

  const maxAvailable = selectedStockItem ? selectedStockItem.availableStock : 0;
  const numQuantity = parseFloat(quantity) || 0;
  const hasInsufficientStock = numQuantity > maxAvailable;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originWarehouseId || !destinationWarehouseId) {
      setError('Debes seleccionar depósito de origen y destino.');
      return;
    }
    if (originWarehouseId === destinationWarehouseId) {
      setError('El depósito de origen y destino no pueden ser el mismo.');
      return;
    }
    if (!selectedProductId) {
      setError('Debes seleccionar un producto a transferir.');
      return;
    }
    if (numQuantity <= 0) {
      setError('La cantidad a transferir debe ser mayor a 0.');
      return;
    }
    if (hasInsufficientStock) {
      setError(`Stock insuficiente en origen. Solo hay ${maxAvailable} un. disponibles.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await onConfirmTransfer({
        originWarehouseId,
        destinationWarehouseId,
        productId: selectedProductId,
        quantity: numQuantity,
        reason: reason.trim(),
      });

      const originName = warehouses.find((w) => w.id === originWarehouseId)?.name || 'Origen';
      const destName = warehouses.find((w) => w.id === destinationWarehouseId)?.name || 'Destino';

      setTransferSuccess({
        transferNumber: result.transferNumber,
        productName: selectedStockItem?.productName || 'Producto',
        quantity: numQuantity,
        originName,
        destName,
      });
    } catch (err: any) {
      console.error('Error en transferencia:', err);
      setError(err.message || 'Error al procesar la transferencia entre depósitos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="h-13 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </div>
            <h3 id="transfer-modal-title" className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Transferencia Interna entre Depósitos
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="w-7 h-7 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Si la transferencia se completó con éxito */}
        {transferSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                {transferSuccess.transferNumber}
              </span>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                ¡Transferencia Asentada en Kardex!
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Se descontaron <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{transferSuccess.quantity} un.</strong> de{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">{transferSuccess.originName}</strong> y se ingresaron en{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">{transferSuccess.destName}</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-left space-y-1 font-mono">
              <p className="text-zinc-700 dark:text-zinc-300">Artículo: <strong className="font-sans text-zinc-900 dark:text-zinc-100">{transferSuccess.productName}</strong></p>
              <p className="text-zinc-700 dark:text-zinc-300">Cantidad: <strong>{transferSuccess.quantity} unidades</strong></p>
              <p className="text-zinc-700 dark:text-zinc-300">Fecha: {new Date().toLocaleString('es-AR')}</p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTransferSuccess(null);
                  setSelectedProductId('');
                  setQuantity('');
                }}
                className="h-8 px-3.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Nueva Transferencia
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 font-medium"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Selector de Depósitos Origen y Destino */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <div>
                <label htmlFor="trf-origin" className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Depósito Origen (Sale)
                </label>
                <select
                  id="trf-origin"
                  value={originWarehouseId}
                  onChange={(e) => {
                    setOriginWarehouseId(e.target.value);
                    setSelectedProductId('');
                  }}
                  className="w-full h-8 px-2 rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.isDefault ? '(Principal)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="trf-dest" className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Depósito Destino (Entra)
                </label>
                <select
                  id="trf-dest"
                  value={destinationWarehouseId}
                  onChange={(e) => setDestinationWarehouseId(e.target.value)}
                  className="w-full h-8 px-2 rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
                >
                  {warehouses
                    .filter((w) => w.id !== originWarehouseId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Selector de Producto */}
            <div>
              <label htmlFor="trf-prod" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Producto a Transferir *
              </label>
              <select
                id="trf-prod"
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full h-8 px-2 rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
              >
                <option value="">-- Seleccionar producto con stock --</option>
                {availableProductsInOrigin.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.productName} (Disponible: {p.availableStock} un.)
                  </option>
                ))}
              </select>
              {availableProductsInOrigin.length === 0 && (
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
                  No hay productos con stock disponible en el depósito de origen seleccionado.
                </p>
              )}
            </div>

            {/* Cantidad a Transferir con validador de stock máximo */}
            {selectedProductId && (
              <div className="space-y-1.5 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="trf-qty" className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Cantidad a Enviar *
                  </label>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    Stock Disponible: <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{maxAvailable} un.</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="trf-qty"
                    type="number"
                    min="1"
                    max={maxAvailable}
                    step="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full h-8 px-2.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(String(maxAvailable))}
                    className="h-8 px-2.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    Máximo ({maxAvailable})
                  </button>
                </div>

                {hasInsufficientStock && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    ⚠️ La cantidad excede el stock disponible en el origen.
                  </p>
                )}
              </div>
            )}

            {/* Motivo o Remito Interno */}
            <div>
              <label htmlFor="trf-reason" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Motivo / Justificación del Traslado
              </label>
              <input
                id="trf-reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Reposición de mercadería para mostrador sucursal 2..."
                className="w-full h-8 px-2.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
              />
            </div>

            {/* Botones de acción */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  !selectedProductId ||
                  numQuantity <= 0 ||
                  hasInsufficientStock ||
                  warehouses.length < 2
                }
                className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 active:bg-zinc-950 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {loading ? 'Transfiriendo...' : 'Confirmar Transferencia'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
