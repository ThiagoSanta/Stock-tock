'use client';

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

      // Limpiar y cerrar
      setName('');
      setSku('');
      setBarcode('');
      setCostPrice('0');
      setSalePrice('0');
      setInitialStock('0');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl bg-[#121214] border border-[#27272a] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="h-14 px-5 border-b border-[#222226] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">Nuevo Producto</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md hover:bg-[#1f1f23] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Pintura Látex Interior 10L"
              className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#84cc16]"
            />
          </div>

          {/* SKU & Código de Barras */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                SKU / Código Interno *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="PIN-LAT-10"
                className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#84cc16]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Código de Barras (EAN)
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="779000123456"
                className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#84cc16]"
              />
            </div>
          </div>

          {/* Unidad & Stock Mínimo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Unidad de Medida
              </label>
              <select
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value as any)}
                className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
              >
                <option value="UNIDAD">Unidad</option>
                <option value="KG">Kilogramos (KG)</option>
                <option value="LITRO">Litros</option>
                <option value="METRO">Metros</option>
                <option value="PACK">Pack / Caja</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Alerta de Stock Mínimo
              </label>
              <input
                type="number"
                min="0"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs font-mono text-zinc-100 focus:outline-none focus:border-[#84cc16]"
              />
            </div>
          </div>

          {/* Costo & Precio de Venta */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#222226]">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Costo de Compra ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs font-mono text-zinc-100 focus:outline-none focus:border-[#84cc16]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Precio de Venta ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs font-mono text-[#84cc16] font-semibold focus:outline-none focus:border-[#84cc16]"
              />
            </div>
          </div>

          {/* Stock Inicial */}
          <div className="p-3 rounded-lg bg-[#161619] border border-[#27272a]">
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Stock Físico Inicial a Ingresar
            </label>
            <input
              type="number"
              min="0"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-[#121214] border border-[#27272a] text-xs font-mono text-zinc-100 focus:outline-none focus:border-[#84cc16]"
            />
            <p className="text-[10px] text-zinc-500 mt-1.5">
              Se registrará un movimiento de inventario en el Kardex automáticamente.
            </p>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222226]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 rounded-lg bg-[#18181b] hover:bg-[#202024] text-xs font-medium text-zinc-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-5 rounded-lg bg-[#84cc16] hover:bg-[#74b412] text-black text-xs font-semibold shadow-[0_0_15px_rgba(132,204,22,0.25)] transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Crear Producto</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
