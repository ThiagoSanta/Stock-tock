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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-lg bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-100 text-slate-800 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Venta Rápida (Mostrador / POS)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pantalla de Éxito / Ticket */}
        {completedSale ? (
          <div className="p-6 text-center space-y-3 my-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                ¡Venta Registrada con Éxito!
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprobante <span className="font-mono text-slate-800 font-semibold">{completedSale.saleNumber}</span> • Stock descontado en tiempo real
              </p>
            </div>

            <div className="max-w-xs mx-auto p-3 rounded bg-slate-50 border border-slate-200 text-left space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Cliente:</span>
                <span className="text-slate-900 font-medium">{completedSale.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Medio de Pago:</span>
                <span className="text-slate-900 font-mono font-medium">{completedSale.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1.5 border-t border-slate-200">
                <span className="font-semibold text-slate-800">Total Cobrado:</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  ${completedSale.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setCompletedSale(null);
                  setCart([]);
                }}
                className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Nueva Venta
              </button>
              <button
                onClick={onClose}
                className="h-8 px-3 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 overflow-y-auto space-y-3 flex-1">
            {error && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Buscador de Producto */}
            <div className="relative">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Buscar Producto o Escanear Código
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nombre, SKU o pistolear código de barras..."
                  className="w-full h-8 pl-8 pr-3 rounded bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                />
              </div>

              {filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded bg-white border border-slate-200 shadow-lg overflow-hidden z-20 divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isOut = p.availableStock <= 0;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addToCart(p)}
                        className={`w-full p-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                          isOut ? 'opacity-50' : ''
                        }`}
                      >
                        <div>
                          <p className="font-medium text-slate-900">{p.name}</p>
                          <span className="text-[10px] font-mono text-slate-400">
                            SKU: {p.sku} • Disp: {p.availableStock} {p.unitOfMeasure}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
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
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Ítems en Mostrador ({cart.length})</span>
                </span>
                <span>Subtotal</span>
              </div>

              <div className="p-2 space-y-1 max-h-44 overflow-y-auto divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <p className="p-5 text-center text-xs text-slate-400">
                    Buscá o escaneá un producto arriba para agregarlo.
                  </p>
                ) : (
                  cart.map(({ product, quantity }) => {
                    const isInsufficient = quantity > product.availableStock;
                    return (
                      <div
                        key={product.id}
                        className="p-1.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-500">
                              ${product.salePrice.toLocaleString('es-AR')} c/u
                            </span>
                            {isInsufficient && (
                              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 rounded border border-rose-200">
                                Stock insuficiente (Quedan {product.availableStock})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span
                            className={`w-6 text-center font-mono font-bold ${
                              isInsufficient ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, 1)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="w-20 text-right font-mono font-bold text-slate-900">
                          ${(quantity * product.salePrice).toLocaleString('es-AR')}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Cliente (Opcional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Consumidor Final"
                  className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Medio de Cobro
                </label>
                <div className="grid grid-cols-2 gap-1">
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
                        onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                        className={`h-7 px-2 rounded border text-[11px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 border-slate-900 text-white font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total a Cobrar</span>
                <span className="text-xl font-bold font-mono text-slate-900">
                  ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                {totalAmount > 0 && (
                  <span className="text-[10px] text-emerald-700 block font-medium">
                    Margen bruto: ${estimatedMargin.toLocaleString('es-AR')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 px-3 rounded bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || hasInsufficientStock || loading}
                  className="h-8 px-4 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
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
