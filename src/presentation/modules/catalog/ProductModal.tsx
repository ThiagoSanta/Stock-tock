import React, { useState } from 'react';
import { X, PackagePlus } from 'lucide-react';
import { CreateProductWithStockDTO } from '@/core/application/ports/IProductRepository';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<CreateProductWithStockDTO, 'companyId'>) => Promise<void>;
}

export function ProductModal({ isOpen, onClose, onSave }: ProductModalProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState<'UNIDAD' | 'KG' | 'LITRO' | 'METRO' | 'PACK'>('UNIDAD');
  const [costPrice, setCostPrice] = useState('0');
  const [salePrice, setSalePrice] = useState('0');
  const [wholesalePrice, setWholesalePrice] = useState('0');
  const [specialPrice, setSpecialPrice] = useState('0');
  const [initialStock, setInitialStock] = useState('0');
  const [minStockAlert, setMinStockAlert] = useState('5');
  const [storageLocation, setStorageLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }
    if (!sku.trim()) {
      setError('El SKU es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim() || undefined,
        unitOfMeasure,
        costPrice: parseFloat(costPrice) || 0,
        salePrice: parseFloat(salePrice) || 0,
        wholesalePrice: parseFloat(wholesalePrice) || undefined,
        specialPrice: parseFloat(specialPrice) || undefined,
        initialStock: parseFloat(initialStock) || 0,
        minStockAlert: parseFloat(minStockAlert) || 0,
        storageLocation: storageLocation.trim() || undefined,
      });

      setName('');
      setSku('');
      setBarcode('');
      setStorageLocation('');
      setCostPrice('0');
      setSalePrice('0');
      setWholesalePrice('0');
      setSpecialPrice('0');
      setInitialStock('0');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <div
              aria-hidden="true"
              className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center"
            >
              <PackagePlus className="w-3.5 h-3.5" />
            </div>
            <h3
              id="product-modal-title"
              className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider"
            >
              Nuevo Producto
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de nuevo producto"
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {error && (
            <div
              role="alert"
              className="p-3 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-300 text-xs font-medium"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="prod-name" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nombre del Producto *
            </label>
            <input
              id="prod-name"
              type="text"
              required
              aria-required="true"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Pintura Látex Interior 10L"
              className="w-full h-8 px-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prod-sku" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                SKU / Código Interno *
              </label>
              <input
                id="prod-sku"
                type="text"
                required
                aria-required="true"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="PIN-LAT-10"
                className="w-full h-8 px-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label htmlFor="prod-barcode" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Código de Barras (EAN)
              </label>
              <input
                id="prod-barcode"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="779000123456"
                className="w-full h-8 px-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prod-storage-location" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Ubicación Física en Almacén
            </label>
            <input
              id="prod-storage-location"
              type="text"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              placeholder="Ej: Pasillo 2 / Estantería B / Nivel 3"
              className="w-full h-8 px-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prod-unit" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Unidad de Medida
              </label>
              <select
                id="prod-unit"
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value as any)}
                className="w-full h-8 px-2 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              >
                <option value="UNIDAD">Unidad</option>
                <option value="KG">Kilogramos (KG)</option>
                <option value="LITRO">Litros</option>
                <option value="METRO">Metros</option>
                <option value="PACK">Pack / Caja</option>
              </select>
            </div>
            <div>
              <label htmlFor="prod-min-stock" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Alerta Stock Mínimo
              </label>
              <input
                id="prod-min-stock"
                type="number"
                min="0"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                className="w-full h-8 px-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div>
              <label htmlFor="prod-cost" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Costo de Compra ($)
              </label>
              <input
                id="prod-cost"
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full h-8 px-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label htmlFor="prod-price" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Precio Minorista ($) *
              </label>
              <input
                id="prod-price"
                type="number"
                step="0.01"
                min="0"
                required
                aria-required="true"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full h-8 px-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-2.5 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div>
              <label htmlFor="prod-wholesale-price" className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Precio Mayorista ($)
              </label>
              <input
                id="prod-wholesale-price"
                type="number"
                step="0.01"
                min="0"
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(e.target.value)}
                placeholder="0 = usa minorista"
                className="w-full h-8 px-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
              />
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">Lista 2 para distribuidores</span>
            </div>
            <div>
              <label htmlFor="prod-special-price" className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Precio Gremio / Especial ($)
              </label>
              <input
                id="prod-special-price"
                type="number"
                step="0.01"
                min="0"
                value={specialPrice}
                onChange={(e) => setSpecialPrice(e.target.value)}
                placeholder="0 = usa minorista"
                className="w-full h-8 px-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
              />
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">Lista 3 para técnicos/gremios</span>
            </div>
          </div>

          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <label htmlFor="prod-initial-stock" className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              Stock Físico Inicial a Ingresar
            </label>
            <input
              id="prod-initial-stock"
              type="number"
              min="0"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            />
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
              Genera movimiento auditado INGRESO_AJUSTE en Kardex.
            </p>
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
              disabled={loading}
              className="h-8 px-4 rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 active:bg-zinc-950 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-zinc-900"
            >
              {loading ? 'Guardando...' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
