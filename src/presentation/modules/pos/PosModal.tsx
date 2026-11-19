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
    .slice(0, 5);

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

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.quantity * item.product.salePrice,
    0
  );
  const totalCost = cart.reduce(
    (sum, item) => sum + item.quantity * item.product.costPrice,
    0
  );
  const estimatedMargin = totalAmount - totalCost;

  const hasInsufficientStock = cart.some(
    (item) => item.quantity > item.product.availableStock
  );

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (hasInsufficientStock) {
      setError('Hay productos en el carrito con cantidad superior al stock disponible.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await onCompleteSale({
        paymentMethod,
        customerName: customerName.trim() || 'Consumidor Final',
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pos-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-2xl rounded-lg bg-white border border-slate-300 shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
          <div className="flex items-center gap-2">
            <div
              aria-hidden="true"
              className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center"
            >
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <h3
              id="pos-modal-title"
              className="text-xs font-bold text-slate-900 uppercase tracking-wider"
            >
              Venta Rápida (Mostrador / POS)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de venta rápida"
            className="text-slate-500 hover:text-slate-800 p-1.5 rounded hover:bg-slate-200 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Pantalla de Éxito / Ticket */}
        {completedSale ? (
          <div className="p-6 text-center space-y-3.5 my-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-300">
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                ¡Venta Registrada con Éxito!
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Comprobante{' '}
                <span className="font-mono text-slate-900 font-bold">
                  {completedSale.saleNumber}
                </span>{' '}
                • Stock descontado en tiempo real
              </p>
            </div>

            <div className="max-w-xs mx-auto p-3.5 rounded bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Cliente:</span>
                <span className="text-slate-900 font-semibold">{completedSale.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Medio de Pago:</span>
                <span className="text-slate-900 font-mono font-semibold">
                  {completedSale.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-slate-700 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900">Total Cobrado:</span>
                <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                  ${completedSale.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCompletedSale(null);
                  setCart([]);
                }}
                className="h-8 px-3.5 rounded bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                Nueva Venta
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3.5 rounded bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
            {error && (
              <div
                role="alert"
                className="p-3 rounded bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2 font-medium"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Buscador de Producto */}
            <div className="relative">
              <label htmlFor="pos-search" className="block text-xs font-semibold text-slate-700 mb-1">
                Buscar Producto o Escanear Código
              </label>
              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="pos-search"
                  type="search"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nombre, SKU o pistolear código de barras..."
                  className="w-full h-8 pl-8 pr-3 rounded bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {filteredProducts.length > 0 && (
                <div
                  role="listbox"
                  className="absolute top-full left-0 right-0 mt-1 rounded bg-white border border-slate-300 shadow-lg overflow-hidden z-20 divide-y divide-slate-100"
                >
                  {filteredProducts.map((p) => {
                    const isOut = p.availableStock <= 0;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="option"
                        aria-selected="false"
                        disabled={isOut}
                        onClick={() => addToCart(p)}
                        className={`w-full p-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer ${
                          isOut ? 'opacity-40 cursor-not-allowed bg-slate-50' : ''
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <span className="text-[11px] font-mono text-slate-600">
                            SKU: {p.sku} • Disp: {p.availableStock} {p.unitOfMeasure}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          ${p.salePrice.toLocaleString('es-AR')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lista del Carrito */}
            <div className="rounded border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                  <span>Ítems en Mostrador ({cart.length})</span>
                </span>
                <span>Subtotal</span>
              </div>

              <div className="p-2 space-y-1 max-h-44 overflow-y-auto divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <p className="p-5 text-center text-xs text-slate-500 font-medium">
                    Buscá o escaneá un producto arriba para agregarlo.
                  </p>
                ) : (
                  cart.map(({ product, quantity }) => {
                    const isInsufficient = quantity > product.availableStock;
                    return (
                      <div
                        key={product.id}
                        className="p-2 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-mono text-slate-600">
                              ${product.salePrice.toLocaleString('es-AR')} c/u
                            </span>
                            {isInsufficient && (
                              <span className="text-[11px] font-semibold text-rose-900 bg-rose-50 px-1.5 rounded border border-rose-300">
                                Stock insuficiente (Quedan {product.availableStock})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label={`Restar una unidad de ${product.name}`}
                            onClick={() => updateQuantity(product.id, -1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Minus className="w-3 h-3" aria-hidden="true" />
                          </button>
                          <span
                            className={`w-7 text-center font-mono font-bold tabular-nums ${
                              isInsufficient ? 'text-rose-700' : 'text-slate-900'
                            }`}
                          >
                            {quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Sumar una unidad de ${product.name}`}
                            onClick={() => updateQuantity(product.id, 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>

                        <span className="w-20 text-right font-mono font-bold text-slate-900 tabular-nums">
                          ${(quantity * product.salePrice).toLocaleString('es-AR')}
                        </span>

                        <button
                          type="button"
                          aria-label={`Quitar ${product.name} del carrito`}
                          onClick={() => removeFromCart(product.id)}
                          className="text-slate-400 hover:text-rose-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Medio de Pago y Cliente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="pos-customer" className="block text-xs font-semibold text-slate-700 mb-1">
                  Cliente (Opcional)
                </label>
                <input
                  id="pos-customer"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Consumidor Final"
                  className="w-full h-8 px-2.5 rounded bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medio de Cobro
                </label>
                <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Medio de cobro">
                  {[
                    { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                    { id: 'TRANSFERENCIA', label: 'Transfer.', icon: ArrowRightLeft },
                    { id: 'TARJETA_DEBITO', label: 'Débito', icon: CreditCard },
                    { id: 'TARJETA_CREDITO', label: 'Crédito', icon: CreditCard },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                        className={`h-7 px-2 rounded border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3 h-3" aria-hidden="true" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-600 uppercase block font-bold tracking-wider">
                  Total a Cobrar
                </span>
                <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                  ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                {totalAmount > 0 && (
                  <span className="text-xs text-emerald-800 block font-semibold">
                    Margen bruto: ${estimatedMargin.toLocaleString('es-AR')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 px-3 rounded bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || hasInsufficientStock || loading}
                  className="h-8 px-4 rounded bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                  {loading ? 'Cobrando...' : 'Confirmar y Cobrar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
