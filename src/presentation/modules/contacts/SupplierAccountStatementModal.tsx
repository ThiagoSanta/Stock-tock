import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  Building2,
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Banknote,
} from 'lucide-react';
import { SupplierWithMetrics } from '@/core/domain/contacts/types';
import { createClient } from '@/utils/supabase/client';

interface SupplierAccountMovement {
  id: string;
  date: string;
  type: 'COMPRA' | 'PAGO_EMITIDO';
  voucherNumber: string;
  description: string;
  debit: number;   // Aumenta la deuda con el proveedor (compras)
  credit: number;  // Disminuye la deuda (pagos)
  balance: number; // Saldo acumulado
}

interface SupplierAccountStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierWithMetrics | null;
  companyName: string;
  onOpenPayment?: (supplier: SupplierWithMetrics) => void;
}

export function SupplierAccountStatementModal({
  isOpen,
  onClose,
  supplier,
  companyName,
  onOpenPayment,
}: SupplierAccountStatementModalProps) {
  const [movements, setMovements] = useState<SupplierAccountMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !supplier) return;
    const activeSupplier = supplier;

    let isMounted = true;
    async function loadHistory() {
      setLoading(true);
      try {
        const supabase = createClient();

        // 1. Obtener compras a este proveedor
        const { data: purchasesData } = await supabase
          .from('purchases')
          .select('id, purchase_number, total_amount, status, notes, created_at')
          .eq('company_id', activeSupplier.companyId)
          .eq('supplier_id', activeSupplier.id)
          .neq('status', 'CANCELADA')
          .order('created_at', { ascending: true });

        // 2. Obtener pagos emitidos a este proveedor
        const { data: paymentsData } = await supabase
          .from('supplier_payments')
          .select('id, payment_order_number, amount, payment_method, notes, created_at')
          .eq('company_id', activeSupplier.companyId)
          .eq('supplier_id', activeSupplier.id)
          .order('created_at', { ascending: true });

        // 3. Unificar cronológicamente
        const allItems: {
          id: string;
          date: string;
          type: 'COMPRA' | 'PAGO_EMITIDO';
          voucherNumber: string;
          description: string;
          amount: number;
        }[] = [];

        (purchasesData || []).forEach((p: any) => {
          allItems.push({
            id: p.id,
            date: p.created_at,
            type: 'COMPRA',
            voucherNumber: p.purchase_number || `COM-${p.id.slice(0, 6)}`,
            description: p.notes || `Compra de mercadería (${p.status})`,
            amount: Number(p.total_amount || 0),
          });
        });

        (paymentsData || []).forEach((pay: any) => {
          allItems.push({
            id: pay.id,
            date: pay.created_at,
            type: 'PAGO_EMITIDO',
            voucherNumber: pay.payment_order_number || `OP-${pay.id.slice(0, 6)}`,
            description: pay.notes
              ? `Pago (${pay.payment_method}) - ${pay.notes}`
              : `Orden de Pago (${pay.payment_method})`,
            amount: Number(pay.amount || 0),
          });
        });

        // Ordenar por fecha ascendente para balance cronológico
        allItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let runningBalance = 0;
        const result: SupplierAccountMovement[] = allItems.map((item) => {
          if (item.type === 'COMPRA') {
            runningBalance += item.amount;
            return {
              id: item.id,
              date: item.date,
              type: 'COMPRA',
              voucherNumber: item.voucherNumber,
              description: item.description,
              debit: item.amount,
              credit: 0,
              balance: runningBalance,
            };
          } else {
            runningBalance -= item.amount;
            return {
              id: item.id,
              date: item.date,
              type: 'PAGO_EMITIDO',
              voucherNumber: item.voucherNumber,
              description: item.description,
              debit: 0,
              credit: item.amount,
              balance: runningBalance,
            };
          }
        });

        if (isMounted) {
          setMovements(result);
        }
      } catch (err) {
        console.error('Error cargando estado de cuenta del proveedor:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [isOpen, supplier]);

  if (!isOpen || !supplier) return null;

  const totalPurchased = movements.reduce((sum, m) => sum + m.debit, 0);
  const totalPaid = movements.reduce((sum, m) => sum + m.credit, 0);
  const currentBalance = totalPurchased - totalPaid;

  const handlePrint = () => {
    window.print();
  };

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
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Estado de Cuenta Corriente — {supplier.name}
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Action Bar (Screen Only) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 print:hidden">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 block">Saldo Pendiente a Pagar</span>
                <span className={`text-base font-black font-mono ${currentBalance > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'}`}>
                  ${currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenPayment && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPayment(supplier);
                  }}
                  className="h-8 px-3 rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Emitir Pago</span>
                </button>
              )}
              <button
                type="button"
                onClick={handlePrint}
                className="h-8 px-3 rounded bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Resumen A4</span>
              </button>
            </div>
          </div>

          {/* Printable A4 Report */}
          <div
            id="printable-a4-voucher"
            className="bg-white dark:bg-zinc-900 p-6 border border-zinc-300 dark:border-zinc-700 rounded max-w-3xl mx-auto space-y-5 text-zinc-900 dark:text-zinc-100 font-sans shadow-sm print:border-none print:shadow-none print:p-0"
          >
            {/* Header Documento */}
            <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-3">
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight">{companyName}</h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Control de Proveedores & Cuentas Corrientes</p>
              </div>
              <div className="text-right">
                <div className="inline-block bg-zinc-900 text-white px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wide">
                  Resumen de Cuenta
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Emitido: {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Ficha del Proveedor */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 block">Razón Social</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{supplier.name}</span>
                {supplier.taxId && (
                  <span className="block font-mono text-zinc-600 dark:text-zinc-400 text-xs">CUIT: {supplier.taxId}</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 block">Contacto & Teléfono</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{supplier.contactName || '—'}</span>
                <span className="block text-zinc-600 dark:text-zinc-400 text-xs">{supplier.phone || supplier.email || '—'}</span>
              </div>
            </div>

            {/* Tabla de Movimientos */}
            {loading ? (
              <div className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cargando movimientos...</span>
              </div>
            ) : movements.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800">
                No hay compras ni pagos asentados para este proveedor.
              </div>
            ) : (
              <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-700 uppercase text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                    <tr>
                      <th className="py-2 px-2.5">Fecha</th>
                      <th className="py-2 px-2.5">Comprobante</th>
                      <th className="py-2 px-2.5">Concepto / Detalle</th>
                      <th className="py-2 px-2.5 text-right">Compra (+)</th>
                      <th className="py-2 px-2.5 text-right">Pago (-)</th>
                      <th className="py-2 px-2.5 text-right">Saldo Deuda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {movements.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                        <td className="py-2 px-2.5 text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
                          {new Date(m.date).toLocaleDateString('es-AR')}
                        </td>
                        <td className="py-2 px-2.5 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {m.voucherNumber}
                        </td>
                        <td className="py-2 px-2.5 text-zinc-700 dark:text-zinc-300">{m.description}</td>
                        <td className="py-2 px-2.5 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                          {m.debit > 0 ? `$${m.debit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-semibold text-emerald-800 dark:text-emerald-300">
                          {m.credit > 0 ? `$${m.credit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          ${m.balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-50 dark:bg-zinc-950 border-t-2 border-zinc-300 dark:border-zinc-700 font-bold">
                    <tr>
                      <td colSpan={3} className="py-2 px-2.5 text-right text-xs uppercase font-bold text-zinc-700 dark:text-zinc-300">
                        Totales Acumulados:
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-zinc-900 dark:text-zinc-100">
                        ${totalPurchased.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-emerald-800 dark:text-emerald-300">
                        ${totalPaid.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-zinc-900 dark:text-zinc-100 text-sm">
                        ${currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Firmas / Pie */}
            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[10px] text-zinc-500 dark:text-zinc-400">
              <div className="border-t border-zinc-300 dark:border-zinc-700 pt-1">
                <span className="block font-medium text-zinc-700 dark:text-zinc-300">Firma Administración / Compras</span>
                <span>{companyName}</span>
              </div>
              <div className="border-t border-zinc-300 dark:border-zinc-700 pt-1">
                <span className="block font-medium text-zinc-700 dark:text-zinc-300">Conforme Proveedor</span>
                <span>{supplier.name}</span>
              </div>
            </div>

            <div className="pt-2 text-center text-[9px] text-zinc-400 dark:text-zinc-500">
              DOCUMENTO DE CONTROL COMERCIAL INTERNO • ESTADO DE CUENTA PROVEEDOR • SIN VALIDEZ FISCAL
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-11 px-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 shrink-0">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {movements.length} movimientos registrados en la cuenta corriente
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
