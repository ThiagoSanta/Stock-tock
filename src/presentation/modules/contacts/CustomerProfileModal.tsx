import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  DollarSign,
  Package,
  Calendar,
  Printer,
  FileSpreadsheet,
  Banknote,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { CustomerWithMetrics } from '@/core/domain/contacts/types';
import { createClient } from '@/utils/supabase/client';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerWithMetrics | null;
  companyName: string;
  onOpenPayment?: (customer: CustomerWithMetrics) => void;
  onOpenStatement?: (customer: CustomerWithMetrics) => void;
}

interface CustomerSale {
  id: string;
  saleNumber: string;
  date: string;
  totalAmount: number;
  paymentMethod: string;
  notes: string | null;
}

interface TopPurchasedItem {
  productId: string;
  name: string;
  sku: string;
  totalQuantity: number;
  totalSpent: number;
}

export function CustomerProfileModal({
  isOpen,
  onClose,
  customer,
  companyName,
  onOpenPayment,
  onOpenStatement,
}: CustomerProfileModalProps) {
  const [sales, setSales] = useState<CustomerSale[]>([]);
  const [topItems, setTopItems] = useState<TopPurchasedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'SALES' | 'TOP_ITEMS'>('SALES');

  useEffect(() => {
    if (!isOpen || !customer) return;
    const activeCustomer = customer;

    let isMounted = true;
    async function loadCustomerProfile() {
      setLoading(true);
      try {
        const supabase = createClient();

        // 1. Obtener todas las ventas del cliente
        const { data: salesData, error: salesErr } = await supabase
          .from('sales')
          .select('id, sale_number, total_amount, payment_method, notes, created_at')
          .eq('company_id', activeCustomer.companyId)
          .eq('customer_id', activeCustomer.id)
          .order('created_at', { ascending: false });

        if (salesErr) throw salesErr;

        const mappedSales: CustomerSale[] = (salesData || []).map((s: any) => ({
          id: s.id,
          saleNumber: s.sale_number || `VTA-${s.id.slice(0, 6)}`,
          date: s.created_at,
          totalAmount: Number(s.total_amount || 0),
          paymentMethod: s.payment_method,
          notes: s.notes,
        }));

        if (isMounted) setSales(mappedSales);

        // 2. Obtener productos favoritos / más comprados desde sale_items
        const saleIds = (salesData || []).map((s: any) => s.id);
        if (saleIds.length > 0) {
          const { data: itemsData } = await supabase
            .from('sale_items')
            .select(`
              product_id,
              quantity,
              subtotal,
              products (name, sku)
            `)
            .in('sale_id', saleIds);

          const itemMap = new Map<string, TopPurchasedItem>();
          (itemsData || []).forEach((row: any) => {
            const pid = row.product_id;
            const existing = itemMap.get(pid);
            const qty = Number(row.quantity || 0);
            const spent = Number(row.subtotal || 0);

            if (!existing) {
              itemMap.set(pid, {
                productId: pid,
                name: row.products?.name || 'Producto',
                sku: row.products?.sku || '—',
                totalQuantity: qty,
                totalSpent: spent,
              });
            } else {
              existing.totalQuantity += qty;
              existing.totalSpent += spent;
            }
          });

          const sortedTop = Array.from(itemMap.values()).sort(
            (a, b) => b.totalQuantity - a.totalQuantity
          );

          if (isMounted) setTopItems(sortedTop);
        } else {
          if (isMounted) setTopItems([]);
        }
      } catch (err) {
        console.error('Error cargando perfil del cliente:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCustomerProfile();

    return () => {
      isMounted = false;
    };
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const currentDebt = customer.currentBalance ?? 0;
  const creditLimit = customer.creditLimit ?? 0;
  const availableCredit = creditLimit > 0 ? Math.max(0, creditLimit - currentDebt) : null;
  const creditUsagePercent = creditLimit > 0 ? Math.min(100, Math.round((currentDebt / creditLimit) * 100)) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-4xl max-h-[92vh] rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Ficha del Cliente — {customer.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Ficha Principal y Datos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Datos Personales */}
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded space-y-2 text-xs">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-1.5">
                <span>{customer.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${customer.active ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-zinc-200 text-zinc-600 dark:text-zinc-400'}`}>
                  {customer.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {customer.taxId && (
                <div className="text-zinc-600 dark:text-zinc-400 font-mono">CUIT/DNI: {customer.taxId}</div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                  <Phone className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <span>{customer.address}</span>
                </div>
              )}
              {customer.notes && (
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-800 italic">
                  "{customer.notes}"
                </div>
              )}
            </div>

            {/* Política Comercial & Límite de Crédito */}
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded space-y-2.5 text-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 block">Política Comercial</span>

              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-400">Lista de Precios:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                  {customer.priceList || 'MINORISTA'}
                </span>
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">Límite de Crédito:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {creditLimit > 0 ? `$${creditLimit.toLocaleString('es-AR')}` : 'Sin Límite'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">Deuda en Cta. Cte.:</span>
                  <span className={`font-mono font-bold ${currentDebt > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    ${currentDebt.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {availableCredit !== null && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-600 dark:text-zinc-400">Crédito Disponible:</span>
                    <span className="font-mono text-emerald-800 dark:text-emerald-300">
                      ${availableCredit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {creditUsagePercent !== null && (
                  <div className="pt-1">
                    <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">
                      <span>Uso de crédito</span>
                      <span>{creditUsagePercent}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${creditUsagePercent > 90 ? 'bg-rose-500' : creditUsagePercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${creditUsagePercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded flex flex-col justify-between text-xs space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 block mb-2">Operaciones Rápidas</span>
                <div className="space-y-1.5">
                  {onOpenPayment && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPayment(customer);
                      }}
                      className="w-full h-8 px-3 rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Registrar Cobro / Recibo A4</span>
                    </button>
                  )}
                  {onOpenStatement && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenStatement(customer);
                      }}
                      className="w-full h-8 px-3 rounded bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                      <span>Ver Estado de Cuenta A4</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                Historial: <strong>{customer.totalOrdersCount}</strong> compras realizadas por un total de <strong>${customer.totalSpent.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>.
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('SALES')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold transition-all cursor-pointer ${
                activeTab === 'SALES' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Historial de Ventas ({sales.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('TOP_ITEMS')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold transition-all cursor-pointer ${
                activeTab === 'TOP_ITEMS' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Productos Más Comprados ({topItems.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Cargando actividad del cliente...</span>
            </div>
          ) : activeTab === 'SALES' ? (
            sales.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800">
                No hay ventas registradas para este cliente.
              </div>
            ) : (
              <div className="rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 uppercase text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                    <tr>
                      <th className="py-2 px-3">Fecha & Hora</th>
                      <th className="py-2 px-3">Nº Venta</th>
                      <th className="py-2 px-3">Medio de Pago</th>
                      <th className="py-2 px-3">Notas</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {sales.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                        <td className="py-2 px-3 font-mono text-zinc-600 dark:text-zinc-400 text-[11px]">
                          {new Date(s.date).toLocaleDateString('es-AR')} {new Date(s.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">{s.saleNumber}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${s.paymentMethod === 'CUENTA_CORRIENTE' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                            {s.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 truncate max-w-xs">{s.notes || '—'}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          ${s.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            topItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800">
                No hay artículos comprados por este cliente.
              </div>
            ) : (
              <div className="rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 uppercase text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                    <tr>
                      <th className="py-2 px-3">Producto / Artículo</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3 text-right">Unidades Compradas</th>
                      <th className="py-2 px-3 text-right">Monto Total Facturado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {topItems.map((item) => (
                      <tr key={item.productId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                        <td className="py-2 px-3 font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</td>
                        <td className="py-2 px-3 font-mono text-zinc-600 dark:text-zinc-400 text-[11px]">{item.sku}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {item.totalQuantity.toLocaleString('es-AR')} un.
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800 dark:text-emerald-300">
                          ${item.totalSpent.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="h-11 px-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 shrink-0">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Ficha comercial y métricas en tiempo real
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-7 px-3 rounded border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
