'use client';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-[#121214] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-14 px-6 border-b border-[#222226] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">Nueva Orden de Compra</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-[#1a1a1e]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Proveedor */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Proveedor *
            </label>
            <input
              type="text"
              required
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Ej: Distribuidora Mayorista Bosch / Aceros SA"
              className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#84cc16]"
            />
          </div>

          {/* Buscar Producto para agregar */}
          <div className="relative">
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Agregar Productos a la Orden
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o SKU para abastecer..."
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#84cc16]"
              />
            </div>

            {/* Dropdown de productos */}
            {filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-[#18181c] border border-[#2a2a30] shadow-xl overflow-hidden z-20">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="w-full p-2.5 text-left text-xs border-b border-[#222226] last:border-0 flex items-center justify-between hover:bg-[#202026] transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-zinc-100">{p.name}</p>
                      <span className="text-[10px] font-mono text-zinc-500">
                        SKU: {p.sku} • Stock actual: {p.physicalStock} un.
                      </span>
                    </div>
                    <span className="font-mono text-xs text-zinc-400">
                      Costo actual: ${p.costPrice.toLocaleString('es-AR')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lista de Ítems a pedir */}
          <div className="rounded-xl bg-[#161619] border border-[#222226] overflow-hidden">
            <div className="p-3 bg-[#1a1a1e] border-b border-[#222226] flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span>Ítems ({items.length})</span>
              <span>Subtotal</span>
            </div>

            <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto divide-y divide-[#202026]">
              {items.length === 0 ? (
                <p className="p-6 text-center text-xs text-zinc-500">
                  Ningún producto seleccionado. Buscá arriba para agregar.
                </p>
              ) : (
                items.map((it) => (
                  <div
                    key={it.product.id}
                    className="p-2 pt-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-zinc-200">{it.product.name}</p>
                      <span className="text-[10px] font-mono text-zinc-500">
                        Stock actual: {it.product.physicalStock} un.
                      </span>
                    </div>

                    {/* Cantidad a comprar */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        value={it.quantityOrdered}
                        onChange={(e) =>
                          updateQuantity(it.product.id, parseInt(e.target.value) || 1)
                        }
                        className="w-16 h-8 px-2 rounded bg-[#1f2024] border border-[#2e2e34] text-center font-mono text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
                      />
                      <span className="text-[10px] text-zinc-500">{it.product.unitOfMeasure}</span>
                    </div>

                    {/* Costo Unitario Pactado */}
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.unitCost}
                        onChange={(e) =>
                          updateCost(it.product.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-24 h-8 px-2 rounded bg-[#1f2024] border border-[#2e2e34] text-right font-mono text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
                      />
                    </div>

                    {/* Subtotal */}
                    <span className="w-24 text-right font-mono font-bold text-zinc-100">
                      ${(it.quantityOrdered * it.unitCost).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeItem(it.product.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer del Formulario */}
          <div className="pt-4 border-t border-[#222226] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-zinc-400 block">Total Inversión</span>
              <span className="text-2xl font-bold font-mono text-[#84cc16]">
                ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-lg bg-[#18181b] hover:bg-[#202024] text-xs font-medium text-zinc-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={items.length === 0 || loading}
                className="h-10 px-6 rounded-lg bg-[#84cc16] hover:bg-[#74b412] disabled:opacity-40 text-black text-xs font-bold shadow-sm transition-all"
              >
                {loading ? 'Emitiendo...' : 'Emitir Orden de Compra'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
