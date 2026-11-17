'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  CreditCard,
  Banknote,
  ArrowRightLeft,
} from 'lucide-react';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';
import { PaymentMethod, Sale } from '@/core/domain/sales/types';

interface CartItem {
  product: ProductWithStock;
  quantity: number;
}

interface PosModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductWithStock[];
  companyId: string;
  onCompleteSale: (saleData: {
    paymentMethod: PaymentMethod;
    customerName: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      costPrice: number;
    }>;
  }) => Promise<Sale>;
}

export function PosModal({
  isOpen,
  onClose,
  products,
  onCompleteSale,
}: PosModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCart([]);
      setSearchTerm('');
      setCompletedSale(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtrar productos para la búsqueda
  const filteredProducts = products
    .filter((p) => {
      const q = searchTerm.toLowerCase().trim();
      return (
        q.length > 0 &&
        (p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)))
      );
    })
    .slice(0, 5); // Mostrar hasta 5 coincidencias

  // Agregar al carrito
  const addToCart = (product: ProductWithStock) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSearchTerm('');
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Validaciones y totales
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.quantity * item.product.salePrice,
    0
  );
  const totalCost = cart.reduce(
    (sum, item) => sum + item.quantity * item.product.costPrice,
    0
  );
  const estimatedMargin = totalAmount - totalCost;

  // Verificar si algún ítem supera el stock disponible
  const hasInsufficientStock = cart.some(
    (item) => item.quantity > item.product.availableStock
  );

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (hasInsufficientStock) {
      setError('Hay productos con cantidad superior al stock disponible.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await onCompleteSale({
        paymentMethod,
        customerName: customerName || 'Consumidor Final',
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.salePrice,
          costPrice: item.product.costPrice,
        })),
      });
      setCompletedSale(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la venta');
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
            <div className="w-7 h-7 rounded-lg bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Venta Rápida (Mostrador / POS)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-[#1a1a1e] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pantalla de Éxito / Ticket */}
        {completedSale ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-full bg-[#84cc16]/15 border border-[#84cc16]/30 text-[#84cc16] flex items-center justify-center mx-auto animate-in zoom-in-75">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-zinc-100">
                ¡Venta Registrada con Éxito!
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Comprobante <span className="font-mono text-zinc-200 font-semibold">{completedSale.saleNumber}</span> • Stock descontado en tiempo real
              </p>
            </div>

            <div className="max-w-xs mx-auto p-4 rounded-xl bg-[#161619] border border-[#27272a] text-left space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Cliente:</span>
                <span className="text-zinc-200 font-medium">{completedSale.customerName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Medio de Pago:</span>
                <span className="text-zinc-200 font-mono font-medium">{completedSale.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-zinc-400 pt-2 border-t border-[#222226]">
                <span className="font-semibold text-zinc-200">Total Cobrado:</span>
                <span className="font-mono font-bold text-base text-[#84cc16]">
                  ${completedSale.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => {
                  setCompletedSale(null);
                  setCart([]);
                }}
                className="h-9 px-4 rounded-lg bg-[#84cc16] hover:bg-[#74b412] text-black text-xs font-semibold shadow-sm transition-all"
              >
                Nueva Venta
              </button>
              <button
                onClick={onClose}
                className="h-9 px-4 rounded-lg bg-[#18181b] hover:bg-[#222226] text-zinc-300 text-xs font-medium transition-colors"
              >
                Cerrar Mostrador
              </button>
            </div>
          </div>
        ) : (
          /* Flujo Normal de Venta */
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Buscador de Producto */}
            <div className="relative">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Buscar Producto o Escanear Código de Barras
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Escribí nombre, SKU o pistoleá el código..."
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#84cc16] font-sans"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-[#18181c] border border-[#2a2a30] shadow-xl overflow-hidden z-20">
                  {filteredProducts.map((p) => {
                    const isOut = p.availableStock <= 0;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addToCart(p)}
                        className={`w-full p-2.5 text-left text-xs border-b border-[#222226] last:border-0 flex items-center justify-between hover:bg-[#202026] transition-colors ${
                          isOut ? 'opacity-50' : ''
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-zinc-100">{p.name}</p>
                          <span className="text-[10px] font-mono text-zinc-500">
                            SKU: {p.sku} • Disp: {p.availableStock} {p.unitOfMeasure}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-sm text-[#84cc16]">
                          ${p.salePrice.toLocaleString('es-AR')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lista del Carrito */}
            <div className="rounded-xl bg-[#161619] border border-[#222226] overflow-hidden">
              <div className="p-3 bg-[#1a1a1e] border-b border-[#222226] flex items-center justify-between text-xs font-semibold text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Ítems en el Mostrador ({cart.length})</span>
                </span>
                <span>Subtotal</span>
              </div>

              <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto divide-y divide-[#202026]">
                {cart.length === 0 ? (
                  <p className="p-6 text-center text-xs text-zinc-500">
                    Buscá o escaneá un producto arriba para agregarlo al ticket.
                  </p>
                ) : (
                  cart.map(({ product, quantity }) => {
                    const isInsufficient = quantity > product.availableStock;
                    return (
                      <div
                        key={product.id}
                        className="p-2 pt-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-zinc-200">{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-zinc-500">
                              ${product.salePrice.toLocaleString('es-AR')} c/u
                            </span>
                            {isInsufficient && (
                              <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                                Stock insuficiente (Quedan {product.availableStock})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Cantidad controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1)}
                            className="w-6 h-6 rounded bg-[#202024] hover:bg-[#28282e] text-zinc-300 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span
                            className={`w-8 text-center font-mono font-bold ${
                              isInsufficient ? 'text-rose-400' : 'text-zinc-100'
                            }`}
                          >
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, 1)}
                            className="w-6 h-6 rounded bg-[#202024] hover:bg-[#28282e] text-zinc-300 flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Subtotal */}
                        <span className="w-20 text-right font-mono font-semibold text-zinc-100">
                          ${(quantity * product.salePrice).toLocaleString('es-AR')}
                        </span>

                        {/* Quitar */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="text-zinc-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Medio de Pago y Cliente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Nombre del Cliente (Opcional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Consumidor Final"
                  className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Medio de Cobro Declarado
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                    { id: 'TRANSFERENCIA', label: 'Transferencia', icon: ArrowRightLeft },
                    { id: 'TARJETA_DEBITO', label: 'Débito', icon: CreditCard },
                    { id: 'TARJETA_CREDITO', label: 'Crédito', icon: CreditCard },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                        className={`h-9 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-[#84cc16]/15 border-[#84cc16] text-[#84cc16]'
                            : 'bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer con Total y Botón de Cobro */}
            <div className="pt-4 border-t border-[#222226] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 block">Total a Cobrar</span>
                <span className="text-2xl font-bold font-mono text-[#84cc16]">
                  ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                {totalAmount > 0 && (
                  <span className="text-[10px] text-zinc-500 block">
                    Margen bruto est.: ${estimatedMargin.toLocaleString('es-AR')}
                  </span>
                )}
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
                  type="button"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || hasInsufficientStock || loading}
                  className="h-10 px-6 rounded-lg bg-[#84cc16] hover:bg-[#74b412] disabled:opacity-40 disabled:pointer-events-none text-black text-xs font-bold shadow-[0_0_20px_rgba(132,204,22,0.3)] transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Registrando Venta...</span>
                    </>
                  ) : (
                    <span>Confirmar y Cobrar</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
