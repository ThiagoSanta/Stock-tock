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
  const [initialStock, setInitialStock] = useState('0');
  const [minStockAlert, setMinStockAlert] = useState('5');
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
        name,
        sku,
        barcode: barcode || undefined,
        unitOfMeasure,
        costPrice: parseFloat(costPrice) || 0,
        salePrice: parseFloat(salePrice) || 0,
        initialStock: parseFloat(initialStock) || 0,
        minStockAlert: parseFloat(minStockAlert) || 0,
      });

      setName('');
      setSku('');
      setBarcode('');
      setCostPrice('0');
      setSalePrice('0');
      setInitialStock('0');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-lg bg-white border border-slate-200 shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-100 text-slate-800 flex items-center justify-center">
              <PackagePlus className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Nuevo Producto
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Pintura Látex Interior 10L"
              className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                SKU / Código Interno *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="PIN-LAT-10"
                className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Código de Barras (EAN)
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="779000123456"
                className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Unidad de Medida
              </label>
              <select
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value as any)}
                className="w-full h-8 px-2 rounded bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              >
                <option value="UNIDAD">Unidad</option>
                <option value="KG">Kilogramos (KG)</option>
                <option value="LITRO">Litros</option>
                <option value="METRO">Metros</option>
                <option value="PACK">Pack / Caja</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Alerta Stock Mínimo
              </label>
              <input
                type="number"
                min="0"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Costo de Compra ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Precio de Venta ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs font-mono text-slate-900 font-semibold focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="p-3 rounded bg-slate-50 border border-slate-200">
            <label className="block text-[11px] font-medium text-slate-700 mb-1">
              Stock Físico Inicial a Ingresar
            </label>
            <input
              type="number"
              min="0"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-400"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Genera movimiento auditado INGRESO_AJUSTE en Kardex.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-8 px-3 rounded bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-8 px-4 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? 'Guardando...' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
