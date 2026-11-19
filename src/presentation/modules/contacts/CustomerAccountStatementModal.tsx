import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  Building2,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
} from 'lucide-react';
import { CustomerWithMetrics } from '@/core/domain/contacts/types';
import { createClient } from '@/utils/supabase/client';

interface AccountMovement {
  id: string;
  date: string;
  type: 'VENTA_CUENTA' | 'PAGO_RECIBIDO';
  voucherNumber: string;
  description: string;
  debit: number;   // Aumenta la deuda (compras)
  credit: number;  // Disminuye la deuda (pagos)
  balance: number; // Saldo después de esta operación
}

interface CustomerAccountStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerWithMetrics | null;
  companyName: string;
  onOpenPayment?: (customer: CustomerWithMetrics) => void;
}

export function CustomerAccountStatementModal({
  isOpen,
  onClose,
  customer,
  companyName,
  onOpenPayment,
}: CustomerAccountStatementModalProps) {
  const [movements, setMovements] = useState<AccountMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !customer) return;

    let isMounted = true;
    async function loadHistory() {
      setLoading(true);
      try {
        const supabase = createClient();

        // 1. Obtener ventas a cuenta corriente de este cliente
        const { data: salesData } = await supabase
          .from('sales')
          .select('id, sale_number, total_amount, payment_method, notes, created_at')
          .eq('company_id', customer.companyId)
          .eq('customer_id', customer.id)
          .eq('payment_method', 'CUENTA_CORRIENTE')
          .order('created_at', { ascending: true });

        // 2. Obtener pagos/recibos registrados
        const { data: paymentsData } = await supabase
          .from('customer_payments')
          .select('id, receipt_number, amount, payment_method, notes, created_at')
          .eq('company_id', customer.companyId)
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: true });

        // 3. Unificar y ordenar cronológicamente
        const rawList: Array<{
          id: string;
          date: string;
          type: 'VENTA_CUENTA' | 'PAGO_RECIBIDO';
          voucherNumber: string;
          description: string;
          debit: number;
          credit: number;
        }> = [];

        (salesData || []).forEach((s: any) => {
          rawList.push({
            id: s.id,
            date: s.created_at,
            type: 'VENTA_CUENTA',
            voucherNumber: s.sale_number,
            description: s.notes || 'Venta a cuenta corriente en mostrador',
            debit: Number(s.total_amount || 0),
            credit: 0,
          });
        });

        (paymentsData || []).forEach((p: any) => {
          rawList.push({
            id: p.id,
            date: p.created_at,
            type: 'PAGO_RECIBIDO',
            voucherNumber: p.receipt_number,
            description: `Cobranza (${p.payment_method})${p.notes ? ` - ${p.notes}` : ''}`,
            debit: 0,
            credit: Number(p.amount || 0),
          });
        });

        rawList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 4. Calcular saldo acumulado paso a paso
        let runningBalance = 0;
        const calculatedMovements: AccountMovement[] = rawList.map((m) => {
          runningBalance += m.debit - m.credit;
          return {
            ...m,
            balance: runningBalance,
          };
        });

        if (isMounted) {
          setMovements(calculatedMovements);
        }
      } catch (err) {
        console.error('Error al cargar movimientos de cuenta corriente:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const totalDebits = movements.reduce((acc, m) => acc + m.debit, 0);
  const totalCredits = movements.reduce((acc, m) => acc + m.credit, 0);
  const currentBalance = totalDebits - totalCredits;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="statement-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera modal (oculta al imprimir) */}
        <div className="h-13 px-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 id="statement-modal-title" className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Estado de Cuenta Corriente
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Cliente: {customer.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPayment && currentBalance > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayment(customer);
                }}
                className="h-7 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
              >
                + Registrar Pago
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="h-7 px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir A4</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenido imprimible en A4 */}
        <div id="printable-a4-voucher" className="p-6 overflow-y-auto space-y-6 font-sans">
          {/* Encabezado A4 */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-700" />
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">{companyName}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Control Comercial Interno • Resumen de Cuenta</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                Estado de Cuenta A4
              </span>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Emisión: {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Ficha del cliente y resumen de saldos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 col-span-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Titular de la Cuenta
              </span>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4 text-slate-400" />
                <p className="text-sm font-bold text-slate-900">{customer.name}</p>
              </div>
              <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                {customer.taxId ? `CUIT/DNI: ${customer.taxId}` : 'Consumidor / Sin documento'}
                {customer.phone ? ` • Tel: ${customer.phone}` : ''}
              </p>
            </div>

            <div
              className={`p-3 rounded-lg border flex flex-col justify-between ${
                currentBalance > 0
                  ? 'bg-rose-50/70 border-rose-200'
                  : 'bg-emerald-50/70 border-emerald-200'
              }`}
            >
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Saldo Actual Pendiente
              </span>
              <p
                className={`text-lg font-mono font-bold leading-none mt-1 ${
                  currentBalance > 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                ${currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-slate-500 mt-1">
                {currentBalance > 0 ? 'Saldo a favor de la empresa' : 'Cuenta al día / Sin deuda'}
              </span>
            </div>
          </div>

          {/* Tarjetas de totales */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
                <span className="text-slate-600">Total Compras a Cuenta:</span>
              </div>
              <strong className="font-mono text-slate-900 font-bold">
                ${totalDebits.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-600">Total Pagos / Entregas:</span>
              </div>
              <strong className="font-mono text-emerald-700 font-bold">
                ${totalCredits.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          {/* Tabla de movimientos cronológicos */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Detalle Cronológico de Operaciones
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                {movements.length} {movements.length === 1 ? 'movimiento' : 'movimientos'}
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                <span>Cargando historial de la cuenta...</span>
              </div>
            ) : movements.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Este cliente aún no registra compras a cuenta corriente ni cobranzas registradas.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2 px-3">Fecha</th>
                    <th className="py-2 px-3">Comprobante</th>
                    <th className="py-2 px-3">Concepto / Detalle</th>
                    <th className="py-2 px-3 text-right">Débito (+)</th>
                    <th className="py-2 px-3 text-right">Crédito (-)</th>
                    <th className="py-2 px-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {new Date(m.date).toLocaleDateString('es-AR')}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {m.voucherNumber}
                      </td>
                      <td className="py-2 px-3 text-slate-700">{m.description}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900">
                        {m.debit > 0
                          ? `$${m.debit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-700 font-semibold">
                        {m.credit > 0
                          ? `-$${m.credit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono font-bold ${
                          m.balance > 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        ${m.balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-900">
                    <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-[11px]">
                      Saldo Final a la Fecha:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      ${totalDebits.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                      -${totalCredits.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono text-sm ${
                        currentBalance > 0 ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      ${currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Firmas al pie para comprobante A4 */}
          <div className="pt-8 grid grid-cols-2 gap-12 text-center border-t border-slate-200">
            <div className="border-t border-slate-400 pt-1.5">
              <p className="font-bold text-slate-900 text-[11px] uppercase">{companyName}</p>
              <p className="text-[10px] text-slate-500">Administración / Tesorería</p>
            </div>
            <div className="border-t border-slate-400 pt-1.5">
              <p className="font-bold text-slate-900 text-[11px] uppercase">{customer.name}</p>
              <p className="text-[10px] text-slate-500">Conformidad de Saldo de Cuenta</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
