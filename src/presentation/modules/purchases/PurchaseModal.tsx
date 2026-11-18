import React, { useState } from 'react';
import { X, Truck, Plus, Trash2, Search } from 'lucide-react';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';
import { Supplier } from '@/core/domain/purchases/types';
import { CreatePurchaseDTO } from '@/core/application/ports/IPurchaseRepository';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductWithStock[];
  suppliers: Supplier[];
  onCreatePurchase: (dto: Omit<CreatePurchaseDTO, 'companyId' | 'warehouseId'>) => Promise<void>;
}

export function PurchaseModal({
  isOpen,
  onClose,
  products,
  suppliers,
  onCreatePurchase,
}: PurchaseModalProps) {
  const [supplierName, setSupplierName] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<
    Array<{
      product: ProductWithStock;
      quantityOrdered: number;
      unitCost: number;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredProducts = products.filter((p) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      q.length > 0 &&
      (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    );
  });

  const addProduct = (prod: ProductWithStock) => {
    setItems((prev) => {
      const exists = prev.find((it) => it.product.id === prod.id);
      if (exists) {
        return prev.map((it) =>
          it.product.id === prod.id
            ? { ...it, quantityOrdered: it.quantityOrdered + 1 }
            : it
        );
      }
      return [...prev, { product: prod, quantityOrdered: 10, unitCost: prod.costPrice }];
    });
    setSearchTerm('');
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) return;
    setItems((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, quantityOrdered: qty } : it))
    );
  };

  const updateCost = (productId: string, cost: number) => {
    if (cost < 0) return;
    setItems((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, unitCost: cost } : it))
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const totalAmount = items.reduce((acc, it) => acc + it.quantityOrdered * it.unitCost, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      setError('El nombre del proveedor es obligatorio.');
      return;
    }
    if (items.length === 0) {
      setError('Debes agregar al menos un producto a la compra.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onCreatePurchase({
        supplierName: supplierName.trim(),
        supplierId: selectedSupplierId || undefined,
        items: items.map((it) => ({
          productId: it.product.id,
          productName: it.product.name,
          quantityOrdered: it.quantityOrdered,
          unitCost: it.unitCost,
        })),
      });

      setSupplierName('');
      setSelectedSupplierId('');
      setItems([]);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar la orden de compra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-lg bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-100 text-slate-800 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Nueva Orden de Compra
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3 flex-1">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Proveedor *
            </label>
            <input
              type="text"
              required
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Ej: Distribuidora Mayorista Bosch / Aceros SA"
              className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>

          <div className="relative">
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Buscar Producto para Comprar
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o SKU..."
                className="w-full h-8 pl-8 pr-3 rounded bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
              />
            </div>

            {filteredProducts.length > 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded bg-white border border-slate-200 shadow-lg divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-xs transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-medium text-slate-900">{p.name}</span>
                      <span className="text-[10px] text-slate-400 ml-2 font-mono">
                        SKU: {p.sku} • Stock Físico: {p.physicalStock} un.
                      </span>
                    </div>
                    <span className="font-mono text-slate-600">
                      Costo PPP: ${p.costPrice.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2">
            <span className="block text-[11px] font-medium text-slate-600">
              Productos a Ordenar ({items.length})
            </span>

            {items.length === 0 ? (
              <div className="p-6 text-center rounded border border-dashed border-slate-200 text-slate-400 text-xs">
                Usa el buscador para añadir artículos a la compra.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded overflow-hidden">
                {items.map((it) => (
                  <div
                    key={it.product.id}
                    className="p-2.5 flex items-center justify-between gap-3 bg-white hover:bg-slate-50/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">
                        {it.product.name}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        SKU: {it.product.sku}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={it.quantityOrdered}
                          onChange={(e) =>
                            updateQuantity(it.product.id, parseFloat(e.target.value) || 1)
                          }
                          className="w-full h-7 px-2 text-center rounded bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900"
                        />
                      </div>

                      <div className="w-24 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.unitCost}
                          onChange={(e) =>
                            updateCost(it.product.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-full h-7 px-2 text-right rounded bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900"
                        />
                      </div>

                      <span className="w-24 text-right font-mono font-bold text-xs text-slate-900">
                        ${(it.quantityOrdered * it.unitCost).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeItem(it.product.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded bg-slate-50 border border-slate-200">
            <span className="text-xs font-medium text-slate-600">Total Orden de Compra</span>
            <span className="text-lg font-bold font-mono text-slate-900">
              ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
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
              disabled={loading || items.length === 0}
              className="h-8 px-4 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Crear Orden de Compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
