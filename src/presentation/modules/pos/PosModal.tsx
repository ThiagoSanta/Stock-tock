import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Printer,
  BookOpen,
  Pause,
  Play,
  Percent,
  DollarSign,
  MessageCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';
import { PaymentMethod, Sale } from '@/core/domain/sales/types';
import { SaleA4InvoiceModal } from '@/presentation/modules/sales/SaleA4InvoiceModal';
import { QuoteA4Modal, QuoteData } from '@/presentation/modules/orders/QuoteA4Modal';
import { createClient } from '@/utils/supabase/client';
import { useUserRole } from '@/utils/security/UserRoleContext';
import { AuditService } from '@/core/application/services/AuditService';

export interface CartItem {
  product: ProductWithStock;
  quantity: number;
}

export interface PausedTicket {
  id: string;
  customerName: string;
  cart: CartItem[];
  adjustmentType: 'NONE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_FIXED' | 'SURCHARGE_PERCENT' | 'SURCHARGE_FIXED';
  adjustmentValue: string;
  paymentMethod: PaymentMethod;
  notes: string;
  timestamp: string;
  total: number;
}

interface PosModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductWithStock[];
  companyId: string;
  companyName?: string;
  defaultWarehouseId?: string;
  onCompleteSale: (saleData: {
    paymentMethod: PaymentMethod;
    customerName: string;
    customerId?: string;
    notes?: string;
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
  companyId,
  companyName = 'Stock·tock',
  defaultWarehouseId,
  onCompleteSale,
}: PosModalProps) {
  const { permissions, currentUser } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [activePriceList, setActivePriceList] = useState<'MINORISTA' | 'MAYORISTA' | 'GREMIO'>('MINORISTA');
  const [availableCustomers, setAvailableCustomers] = useState<Array<{
    id: string;
    name: string;
    creditLimit: number;
    priceList: 'MINORISTA' | 'MAYORISTA' | 'GREMIO';
    currentBalance: number;
  }>>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showA4Receipt, setShowA4Receipt] = useState(false);

  // Descuentos y Recargos en Mostrador
  const [adjustmentType, setAdjustmentType] = useState<
    'NONE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_FIXED' | 'SURCHARGE_PERCENT' | 'SURCHARGE_FIXED'
  >('NONE');
  const [adjustmentValue, setAdjustmentValue] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState('');

  // Carritos en Espera (Pausar Venta)
  const [pausedTickets, setPausedTickets] = useState<PausedTicket[]>(() => {
    try {
      const saved = localStorage.getItem('stocktock_paused_pos_tickets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showPausedList, setShowPausedList] = useState(false);

  // Módulo de Presupuestos A4
  const [activeQuote, setActiveQuote] = useState<QuoteData | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Guardar tickets pausados en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('stocktock_paused_pos_tickets', JSON.stringify(pausedTickets));
    } catch {
      // Silencioso
    }
  }, [pausedTickets]);

  // Atajos de teclado en Mostrador (F2, F3, F4, F8, F9)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el modal de A4 o de presupuesto está abierto, no capturar atajos
      if (showA4Receipt || activeQuote) return;

      if (e.key === 'F2') {
        e.preventDefault();
        setPaymentMethod('EFECTIVO');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setPaymentMethod('TRANSFERENCIA');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setPaymentMethod('CUENTA_CORRIENTE');
      } else if (e.key === 'F8') {
        e.preventDefault();
        handlePauseCurrentTicket();
      } else if (e.key === 'F9') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, cart, customerName, adjustmentType, adjustmentValue, paymentMethod, saleNotes, showA4Receipt, activeQuote]);

  // Cargar clientes de la empresa con sus saldos y límites
  useEffect(() => {
    if (!isOpen || !companyId) return;

    const fetchCustomers = async () => {
      try {
        const supabase = createClient();
        const { data: custs } = await supabase
          .from('customers')
          .select('id, name, credit_limit, price_list')
          .eq('company_id', companyId)
          .eq('active', true)
          .order('name');

        if (custs) {
          const { data: salesData } = await supabase
            .from('sales')
            .select('customer_id, total_amount')
            .eq('company_id', companyId)
            .eq('payment_method', 'CUENTA_CORRIENTE')
            .not('customer_id', 'is', null);

          const { data: payData } = await supabase
            .from('customer_payments')
            .select('customer_id, amount')
            .eq('company_id', companyId);

          const debtMap = new Map<string, number>();
          (salesData || []).forEach((s: any) => {
            debtMap.set(s.customer_id, (debtMap.get(s.customer_id) || 0) + Number(s.total_amount || 0));
          });
          (payData || []).forEach((p: any) => {
            debtMap.set(p.customer_id, (debtMap.get(p.customer_id) || 0) - Number(p.amount || 0));
          });

          setAvailableCustomers(
            custs.map((c) => ({
              id: c.id,
              name: c.name,
              creditLimit: Number(c.credit_limit || 0),
              priceList: (c.price_list as any) || 'MINORISTA',
              currentBalance: Math.max(0, debtMap.get(c.id) || 0),
            }))
          );
        }
      } catch (err) {
        console.warn('Error fetching customers in POS:', err);
      }
    };

    fetchCustomers();
  }, [isOpen, companyId]);

  useEffect(() => {
    if (!isOpen) {
      setCart([]);
      setSearchTerm('');
      setCompletedSale(null);
      setError(null);
      setShowA4Receipt(false);
      setActiveQuote(null);
      setAdjustmentType('NONE');
      setAdjustmentValue('');
      setSaleNotes('');
      setShowPausedList(false);
      setSelectedCustomerId('');
      setActivePriceList('MINORISTA');
      setCustomerName('Consumidor Final');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtrado rápido de catálogo
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
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSearchTerm('');
    searchInputRef.current?.focus();
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

  // Resolución de precio dinámico según la lista activa
  const getProductPrice = (product: ProductWithStock, list: 'MINORISTA' | 'MAYORISTA' | 'GREMIO') => {
    if (list === 'MAYORISTA' && product.wholesalePrice && product.wholesalePrice > 0) {
      return product.wholesalePrice;
    }
    if (list === 'GREMIO' && product.specialPrice && product.specialPrice > 0) {
      return product.specialPrice;
    }
    return product.salePrice;
  };

  // Cálculos de Totales y Ajustes (Descuentos y Recargos)
  const rawSubtotal = cart.reduce((sum, item) => sum + item.quantity * getProductPrice(item.product, activePriceList), 0);
  const totalCost = cart.reduce((sum, item) => sum + item.quantity * item.product.costPrice, 0);

  const numAdj = parseFloat(adjustmentValue) || 0;
  let adjustmentAmount = 0; // Positivo si es recargo, negativo si es descuento

  if (adjustmentType === 'DISCOUNT_PERCENT') {
    adjustmentAmount = -((rawSubtotal * numAdj) / 100);
  } else if (adjustmentType === 'DISCOUNT_FIXED') {
    adjustmentAmount = -Math.min(rawSubtotal, numAdj);
  } else if (adjustmentType === 'SURCHARGE_PERCENT') {
    adjustmentAmount = (rawSubtotal * numAdj) / 100;
  } else if (adjustmentType === 'SURCHARGE_FIXED') {
    adjustmentAmount = numAdj;
  }

  const finalTotalAmount = Math.max(0, rawSubtotal + adjustmentAmount);
  const estimatedMargin = finalTotalAmount - totalCost;

  const hasInsufficientStock = cart.some((item) => item.quantity > item.product.availableStock);

  // 1. Pausar ticket actual
  const handlePauseCurrentTicket = () => {
    if (cart.length === 0) return;

    const newTicket: PausedTicket = {
      id: `PAUSA-${Date.now().toString().slice(-6)}`,
      customerName: customerName.trim() || 'Consumidor Final',
      cart: [...cart],
      adjustmentType,
      adjustmentValue,
      paymentMethod,
      notes: saleNotes,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      total: finalTotalAmount,
    };

    setPausedTickets((prev) => [newTicket, ...prev]);
    setCart([]);
    setCustomerName('Consumidor Final');
    setAdjustmentType('NONE');
    setAdjustmentValue('');
    setSaleNotes('');
    setShowPausedList(false);
  };

  // 2. Reanudar ticket pausado
  const handleResumeTicket = (ticket: PausedTicket) => {
    setCart(ticket.cart);
    setCustomerName(ticket.customerName);
    setAdjustmentType(ticket.adjustmentType);
    setAdjustmentValue(ticket.adjustmentValue);
    setPaymentMethod(ticket.paymentMethod);
    setSaleNotes(ticket.notes);
    setPausedTickets((prev) => prev.filter((t) => t.id !== ticket.id));
    setShowPausedList(false);
  };

  // 3. Eliminar ticket pausado
  const handleDeletePausedTicket = (ticketId: string) => {
    setPausedTickets((prev) => prev.filter((t) => t.id !== ticketId));
  };

  // 4. Cobro definitivo de venta
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (hasInsufficientStock) {
      setError('Hay productos en el carrito con cantidad superior al stock disponible.');
      return;
    }

    if (
      paymentMethod === 'CUENTA_CORRIENTE' &&
      (!customerName || customerName.trim() === 'Consumidor Final')
    ) {
      setError('Para vender a Cuenta Corriente debés ingresar el nombre específico del cliente.');
      return;
    }

    setLoading(true);
    setError(null);

    // Preparar detalle de descuento o recargo en notas
    let adjustmentDetail = '';
    if (adjustmentType === 'DISCOUNT_PERCENT') {
      adjustmentDetail = ` [Desc. ${numAdj}%: -$${Math.abs(adjustmentAmount).toFixed(2)}]`;
    } else if (adjustmentType === 'DISCOUNT_FIXED') {
      adjustmentDetail = ` [Desc. Fijo: -$${Math.abs(adjustmentAmount).toFixed(2)}]`;
    } else if (adjustmentType === 'SURCHARGE_PERCENT') {
      adjustmentDetail = ` [Recargo ${numAdj}%: +$${adjustmentAmount.toFixed(2)}]`;
    } else if (adjustmentType === 'SURCHARGE_FIXED') {
      adjustmentDetail = ` [Recargo Fijo: +$${adjustmentAmount.toFixed(2)}]`;
    }

    const fullNotes = `${saleNotes.trim()}${adjustmentDetail}`.trim();

    try {
      // Ajustar proporcionalmente el precio unitario si hubo recargo o descuento global
      const factor = rawSubtotal > 0 ? finalTotalAmount / rawSubtotal : 1;

      const result = await onCompleteSale({
        paymentMethod,
        customerName: customerName.trim() || 'Consumidor Final',
        customerId: selectedCustomerId || undefined,
        notes: fullNotes || undefined,
        items: cart.map((item) => {
          const unitPrice = getProductPrice(item.product, activePriceList);
          return {
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: Math.round(unitPrice * factor * 100) / 100,
            costPrice: item.product.costPrice,
          };
        }),
      });

      setCompletedSale(result);
      // Audit log de venta — no bloqueante
      AuditService.logAction({
        companyId,
        userName: currentUser.name,
        userRole: currentUser.role,
        module: 'VENTAS',
        action: 'VENTA_REGISTRADA',
        entityId: result.id,
        entityName: result.saleNumber,
        details: `Total $${finalTotalAmount.toLocaleString('es-AR')}, Método: ${paymentMethod}, Cliente: ${customerName || 'Consumidor Final'}`,
      }).catch(() => {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la venta');
    } finally {
      setLoading(false);
    }
  };

  // 5. Emitir Presupuesto / Cotización A4
  const handleGenerateQuote = async () => {
    if (cart.length === 0) {
      setError('Agregá al menos 1 producto al carrito para generar el presupuesto.');
      return;
    }

    const quoteNumber = `PTO-${Math.floor(100000 + Math.random() * 900000)}`;
    const today = new Date();
    const validUntilDate = new Date();
    validUntilDate.setDate(today.getDate() + 15);

    const quoteData: QuoteData = {
      quoteNumber,
      date: today.toLocaleDateString('es-AR'),
      validUntil: validUntilDate.toLocaleDateString('es-AR'),
      customerName: customerName.trim() || 'Consumidor / Cliente Solicitante',
      companyName,
      items: cart.map((item) => {
        const unitPrice = getProductPrice(item.product, activePriceList);
        return {
          name: item.product.name,
          quantity: item.quantity,
          unitPrice,
          subtotal: item.quantity * unitPrice,
        };
      }),
      totalAmount: finalTotalAmount,
      notes: saleNotes || undefined,
    };

    // Guardar también en tabla orders como PRESUPUESTO si companyId está disponible
    try {
      if (companyId) {
        const supabase = createClient();
        await supabase.from('orders').insert({
          company_id: companyId,
          warehouse_id: defaultWarehouseId || '00000000-0000-0000-0000-000000000000',
          order_number: quoteNumber,
          status: 'PRESUPUESTO',
          total_amount: finalTotalAmount,
          notes: `Presupuesto emitido a ${customerName}. Validez 15 días. ${saleNotes}`,
        });
      }
    } catch (err) {
      console.warn('Presupuesto no persistido en orders:', err);
    }

    setActiveQuote(quoteData);
  };

  // 6. Enlace WhatsApp directo con comprobante
  const handleSendWhatsApp = () => {
    if (!completedSale) return;

    const itemsText = cart
      .map((it) => `• ${it.quantity}x ${it.product.name} ($${getProductPrice(it.product, activePriceList).toLocaleString('es-AR')})`)
      .join('\n');

    const message =
      `¡Hola! Le enviamos el comprobante de su compra en *${companyName}*:\n\n` +
      `🧾 *Comprobante:* ${completedSale.saleNumber}\n` +
      `👤 *Cliente:* ${completedSale.customerName}\n` +
      `💰 *Total Abonado:* $${completedSale.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}\n` +
      `💳 *Medio de Pago:* ${completedSale.paymentMethod}\n` +
      `📅 *Fecha:* ${new Date(completedSale.createdAt).toLocaleDateString('es-AR')} ${new Date(completedSale.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}\n\n` +
      `📦 *Detalle de Artículos:*\n${itemsText}\n\n` +
      `¡Muchas gracias por su compra!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pos-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150 font-sans">
        {/* Header con Atajos y Botón de Carritos en Espera */}
        <div className="h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <h3 id="pos-modal-title" className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Venta Rápida (Mostrador / POS)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Carritos en Espera */}
            <button
              type="button"
              onClick={() => setShowPausedList((prev) => !prev)}
              className={`h-7 px-2.5 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                pausedTickets.length > 0
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Ver tickets pausados"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>En Espera ({pausedTickets.length})</span>
            </button>

            {/* Botón Pausar Venta */}
            <button
              type="button"
              onClick={handlePauseCurrentTicket}
              disabled={cart.length === 0}
              className="h-7 px-2.5 rounded bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Pausar ticket actual para atender al siguiente cliente (F8)"
            >
              <Pause className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
              <span>Pausar (F8)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar mostrador"
              className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel Desplegable de Carritos en Espera */}
        {showPausedList && (
          <div className="p-3 bg-amber-50/70 border-b border-amber-200 dark:border-amber-800/70 space-y-2 animate-in fade-in duration-100">
            <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300" />
                <span>Tickets Pausados en Mostrador</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPausedList(false)}
                className="text-[11px] text-amber-800 dark:text-amber-300 hover:underline cursor-pointer"
              >
                Cerrar lista
              </button>
            </div>

            {pausedTickets.length === 0 ? (
              <p className="text-xs text-amber-800 dark:text-amber-300">No hay ventas pausadas actualmente.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {pausedTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-2 rounded bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800/70 flex items-center justify-between text-xs shadow-2xs"
                  >
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">
                        {t.customerName}{' '}
                        <span className="font-mono text-zinc-400 dark:text-zinc-500 font-normal">({t.timestamp})</span>
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                        {t.cart.length} artículos • ${t.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleResumeTicket(t)}
                        className="h-6 px-2.5 rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>Reanudar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePausedTicket(t.id)}
                        className="h-6 w-6 rounded text-zinc-400 dark:text-zinc-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Descartar ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pantalla de Éxito / Ticket Cerrado */}
        {completedSale ? (
          <div className="p-6 text-center space-y-4 my-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/70">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">¡Venta Registrada con Éxito!</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Comprobante{' '}
                <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{completedSale.saleNumber}</span> •
                Stock actualizado en tiempo real
              </p>
            </div>

            <div className="max-w-xs mx-auto p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-left space-y-2 text-xs">
              <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
                <span className="font-medium">Cliente:</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{completedSale.customerName}</span>
              </div>
              <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
                <span className="font-medium">Medio de Pago:</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">{completedSale.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-zinc-700 dark:text-zinc-300 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">Total Cobrado:</span>
                <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 tabular-nums">
                  ${completedSale.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Acciones tras la venta */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Compartir comprobante formateado por WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Enviar por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setShowA4Receipt(true)}
                className="h-8 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-zinc-300 dark:border-zinc-700"
              >
                <Printer className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                <span>Imprimir A4</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCompletedSale(null);
                  setCart([]);
                  setShowA4Receipt(false);
                }}
                className="h-8 px-3.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Nueva Venta
              </button>
            </div>

            {showA4Receipt && (
              <SaleA4InvoiceModal
                sale={completedSale}
                onClose={() => setShowA4Receipt(false)}
              />
            )}
          </div>
        ) : (
          <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
            {error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 font-medium"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Buscador de Producto (F9) */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="pos-search" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Buscar Producto o Pistolear Código
                </label>
                <kbd className="text-[10px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 px-1 py-0.2 rounded font-mono">
                  F9 para buscar
                </kbd>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input
                  ref={searchInputRef}
                  id="pos-search"
                  type="search"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Escribí nombre, SKU o escaneá código de barras..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
                />
              </div>

              {filteredProducts.length > 0 && (
                <div
                  role="listbox"
                  className="absolute top-full left-0 right-0 mt-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-xl overflow-hidden z-20 divide-y divide-zinc-100 dark:divide-zinc-800"
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
                        className={`w-full p-2.5 text-left text-xs flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer ${
                          isOut ? 'opacity-40 cursor-not-allowed bg-zinc-50 dark:bg-zinc-950' : ''
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</p>
                          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                            SKU: {p.sku} • Disp: {p.availableStock} {p.unitOfMeasure}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                          ${getProductPrice(p, activePriceList).toLocaleString('es-AR')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lista del Carrito */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                  <span>Ítems en Mostrador ({cart.length})</span>
                </span>
                <span>Subtotal</span>
              </div>

              <div className="p-1 space-y-0.5 max-h-40 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                {cart.length === 0 ? (
                  <p className="p-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
                    Buscá o escaneá un producto arriba para agregarlo.
                  </p>
                ) : (
                  cart.map(({ product, quantity }) => {
                    const isInsufficient = quantity > product.availableStock;
                    return (
                      <div
                        key={product.id}
                        className="p-1.5 flex items-center justify-between gap-2 text-xs hover:bg-zinc-50/50 rounded"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                              ${getProductPrice(product, activePriceList).toLocaleString('es-AR')} c/u
                            </span>
                            {isInsufficient && (
                              <span className="text-[10px] font-semibold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-1 rounded border border-rose-200 dark:border-rose-800/70">
                                Supera stock ({product.availableStock})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1)}
                            className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span
                            className={`w-7 text-center font-mono font-bold tabular-nums ${
                              isInsufficient ? 'text-rose-800 dark:text-rose-300' : 'text-zinc-900 dark:text-zinc-100'
                            }`}
                          >
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, 1)}
                            className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="w-20 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                          ${(quantity * getProductPrice(product, activePriceList)).toLocaleString('es-AR')}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="text-zinc-400 dark:text-zinc-500 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Ajustes de Descuento / Recargo en Mostrador */}
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-[11px] flex items-center gap-1">
                  <Percent className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                  <span>Ajuste comercial:</span>
                </span>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as any)}
                  className="h-7 px-2 rounded border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 focus:outline-none"
                >
                  <option value="NONE">Sin ajuste (Precio lista)</option>
                  <option value="DISCOUNT_PERCENT">Descuento (%)</option>
                  <option value="DISCOUNT_FIXED">Descuento fijo ($)</option>
                  <option value="SURCHARGE_PERCENT">Recargo (%)</option>
                  <option value="SURCHARGE_FIXED">Recargo fijo ($)</option>
                </select>
              </div>

              {adjustmentType !== 'NONE' && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={adjustmentValue}
                    onChange={(e) => setAdjustmentValue(e.target.value)}
                    placeholder={adjustmentType.includes('PERCENT') ? 'Ej: 10' : 'Ej: 1500'}
                    className="w-24 h-7 px-2 rounded border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none"
                  />
                  <span
                    className={`font-mono font-bold text-xs ${
                      adjustmentAmount < 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {adjustmentAmount < 0 ? '-' : '+'}
                    ${Math.abs(adjustmentAmount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* Cliente y Medio de Cobro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="pos-customer" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Cliente Comercial
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Lista:</span>
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded border border-zinc-200 dark:border-zinc-800 text-[10px]">
                      {(['MINORISTA', 'MAYORISTA', 'GREMIO'] as const).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setActivePriceList(tier)}
                          className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                            activePriceList === tier
                              ? tier === 'MAYORISTA'
                                ? 'bg-sky-600 text-white shadow-2xs'
                                : tier === 'GREMIO'
                                ? 'bg-sky-600 text-white shadow-2xs'
                                : 'bg-zinc-900 text-white shadow-2xs'
                              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                          }`}
                          title={`Cambiar a Lista ${tier}`}
                        >
                          {tier === 'MINORISTA' ? 'L1 Minorista' : tier === 'MAYORISTA' ? 'L2 Mayorista' : 'L3 Gremio'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <select
                  id="pos-customer"
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedCustomerId(id);
                    if (!id) {
                      setCustomerName('Consumidor Final');
                      setActivePriceList('MINORISTA');
                    } else {
                      const found = availableCustomers.find((c) => c.id === id);
                      if (found) {
                        setCustomerName(found.name);
                        setActivePriceList(found.priceList || 'MINORISTA');
                      }
                    }
                  }}
                  className="w-full h-8 px-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 font-medium"
                >
                  <option value="">Consumidor Final (Venta mostrador al paso)</option>
                  {availableCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.priceList !== 'MINORISTA' ? `[${c.priceList}]` : ''} {c.creditLimit > 0 ? `• Límite: $${c.creditLimit.toLocaleString('es-AR')}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Medio de Cobro</label>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">F2 Efectivo • F3 Transf • F4 Cta Cte</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1" role="group">
                  {[
                    { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                    { id: 'TRANSFERENCIA', label: 'Transf.', icon: ArrowRightLeft },
                    { id: 'TARJETA_DEBITO', label: 'Débito', icon: CreditCard },
                    { id: 'TARJETA_CREDITO', label: 'Crédito', icon: CreditCard },
                    { id: 'CUENTA_CORRIENTE', label: 'Cta Cte', icon: BookOpen },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                        className={`h-7 px-1 rounded border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 border-zinc-900 text-white shadow-2xs'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="truncate">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Alerta de Límite de Crédito Excedido en Cta Cte */}
            {(() => {
              const cust = availableCustomers.find((c) => c.id === selectedCustomerId);
              if (
                paymentMethod === 'CUENTA_CORRIENTE' &&
                cust &&
                cust.creditLimit > 0 &&
                cust.currentBalance + finalTotalAmount > cust.creditLimit
              ) {
                return (
                  <div
                    role="alert"
                    className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 font-medium"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      <strong>Aviso de Límite de Crédito:</strong> Esta venta a Cta. Cte. superará el límite comercial asignado (${cust.creditLimit.toLocaleString('es-AR')}). Saldo actual: ${cust.currentBalance.toLocaleString('es-AR')} • Saldo proyectado: ${(cust.currentBalance + finalTotalAmount).toLocaleString('es-AR')}.
                    </span>
                  </div>
                );
              }
              return null;
            })()}

            {/* Footer y Totales */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase block font-bold tracking-wider">
                  Total a Cobrar
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                    ${finalTotalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                  {adjustmentAmount !== 0 && (
                    <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 line-through">
                      ${rawSubtotal.toLocaleString('es-AR')}
                    </span>
                  )}
                </div>
                {finalTotalAmount > 0 && permissions.canViewFinancials && (
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block font-semibold">
                    Margen bruto estimado: ${estimatedMargin.toLocaleString('es-AR')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateQuote}
                  disabled={cart.length === 0}
                  className="h-8 px-2.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 disabled:opacity-40 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Emitir presupuesto formal imprimible en A4 sin descontar stock"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                  <span>Presupuesto A4</span>
                </button>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || hasInsufficientStock || loading}
                  className="h-8 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 active:bg-zinc-950 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {loading ? 'Cobrando...' : 'Confirmar y Cobrar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Presupuesto A4 */}
        {activeQuote && (
          <QuoteA4Modal
            isOpen={!!activeQuote}
            onClose={() => setActiveQuote(null)}
            quote={activeQuote}
          />
        )}
      </div>
    </div>
  );
}
