'use client';

import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Trash2, Search } from 'lucide-react';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';
import { CreateOrderDTO } from '@/core/application/ports/IOrderRepository';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductWithStock[];
  onCreateOrder: (dto: Omit<CreateOrderDTO, 'companyId' | 'warehouseId'>) => Promise<void>;
}

export function OrderModal({ isOpen, onClose, products, onCreateOrder }: OrderModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState<
    Array<{
      product: ProductWithStock;
      quantity: number;
      unitPrice: number;
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
    setOrderItems((prev) => {
      const exists = prev.find((it) => it.product.id === prod.id);
      if (exists) {
        return prev.map((it) =>
          it.product.id === prod.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [...prev, { product: prod, quantity: 1, unitPrice: prod.salePrice }];
    });
    setSearchTerm('');
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) return;
    setOrderItems((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, quantity: qty } : it))
    );
  };

  const updatePrice = (productId: string, price: number) => {
    if (price < 0) return;
    setOrderItems((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, unitPrice: price } : it))
    );
  };

  const removeItem = (productId: string) => {
    setOrderItems((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const totalAmount = orderItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('El nombre del cliente es obligatorio.');
      return;
    }
    if (orderItems.length === 0) {
      setError('Debes agregar al menos un producto al pedido.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onCreateOrder({
        customerName: customerName.trim(),
        items: orderItems.map((it) => ({
          productId: it.product.id,
          productName: it.product.name,
          quantityRequested: it.quantity,
          unitPrice: it.unitPrice,
          costPrice: it.product.costPrice,
        })),
      });

      setCustomerName('');
      setOrderItems([]);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el pedido.');
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
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">Nuevo Pedido de Cliente</h3>
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

          {/* Cliente */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Nombre / Razón Social del Cliente *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ej: Distribuidora Sur SRL / Juan Pérez"
              className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#84cc16]"
            />
          </div>

          {/* Buscar Producto para agregar */}
          <div className="relative">
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Agregar Productos al Pedido
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o SKU para agregar..."
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
                        SKU: {p.sku} • Disp: {p.availableStock} un.
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-[#84cc16]">
                      ${p.salePrice.toLocaleString('es-AR')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lista de Ítems */}
          <div className="rounded-xl bg-[#161619] border border-[#222226] overflow-hidden">
            <div className="p-3 bg-[#1a1a1e] border-b border-[#222226] flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span>Ítems ({orderItems.length})</span>
              <span>Subtotal</span>
            </div>

            <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto divide-y divide-[#202026]">
              {orderItems.length === 0 ? (
                <p className="p-6 text-center text-xs text-zinc-500">
                  Ningún producto agregado todavía. Buscá arriba para añadir.
                </p>
              ) : (
                orderItems.map((it) => (
                  <div
                    key={it.product.id}
                    className="p-2 pt-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-zinc-200">{it.product.name}</p>
                      <span className="text-[10px] font-mono text-zinc-500">
                        Disp: {it.product.availableStock} un.
                      </span>
                    </div>

                    {/* Cantidad */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) =>
                          updateQuantity(it.product.id, parseInt(e.target.value) || 1)
                        }
                        className="w-16 h-8 px-2 rounded bg-[#1f2024] border border-[#2e2e34] text-center font-mono text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
                      />
                      <span className="text-[10px] text-zinc-500">{it.product.unitOfMeasure}</span>
                    </div>

                    {/* Precio Unitario */}
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.unitPrice}
                        onChange={(e) =>
                          updatePrice(it.product.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-24 h-8 px-2 rounded bg-[#1f2024] border border-[#2e2e34] text-right font-mono text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
                      />
                    </div>

                    {/* Subtotal */}
                    <span className="w-24 text-right font-mono font-bold text-zinc-100">
                      ${(it.quantity * it.unitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
              <span className="text-[11px] text-zinc-400 block">Total del Pedido</span>
              <span className="text-2xl font-bold font-mono text-zinc-100">
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
                disabled={orderItems.length === 0 || loading}
                className="h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-all"
              >
                {loading ? 'Guardando...' : 'Guardar Pedido'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
