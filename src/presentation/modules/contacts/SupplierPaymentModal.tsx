import React, { useState } from 'react';
import { X, DollarSign, Printer, CheckCircle2, Building2, Truck, Banknote, Loader2 } from 'lucide-react';
import { SupplierWithMetrics } from '@/core/domain/contacts/types';
import { createClient } from '@/utils/supabase/client';

interface SupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierWithMetrics | null;
  companyName: string;
  onPaymentSuccess?: () => void;
}

export function SupplierPaymentModal({
  isOpen,
  onClose,
  supplier,
  companyName,
  onPaymentSuccess,
}: SupplierPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE'>('TRANSFERENCIA');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderGenerated, setOrderGenerated] = useState<{
    orderNumber: string;
    amount: number;
    date: string;
  } | null>(null);

  if (!isOpen || !supplier) return null;

  const numAmount = parseFloat(amount) || 0;

  const handleGeneratePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('El monto a pagar debe ser mayor a 0');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const orderNumber = `OP-${Math.floor(100000 + Math.random() * 900000)}`;

      const { error: insertErr } = await supabase.from('supplier_payments').insert({
        company_id: supplier.companyId,
        supplier_id: supplier.id,
        payment_order_number: orderNumber,
        amount: numAmount,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      });

      if (insertErr) {
        throw new Error(insertErr.message);
      }

      setOrderGenerated({
        orderNumber,
        amount: numAmount,
        date: new Date().toLocaleString('es-AR'),
      });

      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (err: any) {
      console.error('Error registrando pago al proveedor:', err);
      setError(err?.message || 'Error al asentar el pago en el sistema.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center">
              <Banknote className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              {orderGenerated ? 'Comprobante de Pago a Proveedor' : 'Emitir Pago / Orden de Pago'}
            </h3>
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
        {orderGenerated ? (
          <div className="p-6 space-y-6">
            {/* Hoja A4 Imprimible */}
            <div
              id="printable-a4-voucher"
              className="bg-white dark:bg-zinc-900 p-6 border border-zinc-300 dark:border-zinc-700 rounded max-w-md mx-auto space-y-4 text-zinc-900 dark:text-zinc-100 font-sans shadow-sm print:border-none print:shadow-none print:p-0"
            >
              <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-3">
                <div>
                  <h1 className="text-lg font-black uppercase tracking-tight">{companyName}</h1>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Control de Tesorería & Pagos a Proveedores</p>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-zinc-900 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">
                    Orden de Pago
                  </div>
                  <p className="text-sm font-black font-mono mt-1 text-zinc-900 dark:text-zinc-100">{orderGenerated.orderNumber}</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{orderGenerated.date}</p>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Proveedor:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{supplier.name}</span>
                </div>
                {supplier.taxId && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">CUIT:</span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300">{supplier.taxId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Medio de Pago:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{paymentMethod}</span>
                </div>
              </div>

              <div className="border-t border-b border-zinc-300 dark:border-zinc-700 py-3 flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">Monto Cancelado:</span>
                <span className="text-xl font-black font-mono text-zinc-900 dark:text-zinc-100">
                  ${orderGenerated.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {notes && (
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-2 rounded border border-zinc-200 dark:border-zinc-800">
                  <strong>Concepto / Detalle:</strong> {notes}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-8 text-center text-[10px] text-zinc-500 dark:text-zinc-400">
                <div className="border-t border-zinc-300 dark:border-zinc-700 pt-1">
                  <span className="block font-medium text-zinc-700 dark:text-zinc-300">Emitido por Tesorería</span>
                  <span>Firma y Aclaración</span>
                </div>
                <div className="border-t border-zinc-300 dark:border-zinc-700 pt-1">
                  <span className="block font-medium text-zinc-700 dark:text-zinc-300">Recibió Proveedor</span>
                  <span>Firma o Recibo Oficial</span>
                </div>
              </div>

              <div className="pt-2 text-center text-[9px] text-zinc-400 dark:text-zinc-500">
                DOCUMENTO DE CONTROL COMERCIAL INTERNO • SIN VALIDEZ FISCAL
              </div>
            </div>

            <div className="flex gap-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 h-9 rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Comprobante A4</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGeneratePayment} className="p-4 space-y-4">
            {error && (
              <div className="p-3 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Datos del Proveedor */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs space-y-1">
              <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-bold">
                <Truck className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                <span>{supplier.name}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400 text-[11px] pt-1 border-t border-zinc-200 dark:border-zinc-800">
                <span>Saldo Pendiente de Pago:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  ${(supplier.currentBalance ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Monto */}
            <div>
              <label htmlFor="payment-amount" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Monto a Pagar ($) *
              </label>
              <input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-9 px-3 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            {/* Medio de Pago */}
            <div>
              <label htmlFor="payment-method" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Medio de Pago
              </label>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full h-8 px-2 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              >
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="EFECTIVO">Efectivo de Caja</option>
                <option value="CHEQUE">Cheque Propio / Terceros</option>
              </select>
            </div>

            {/* Notas / Observaciones */}
            <div>
              <label htmlFor="payment-notes" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Concepto / N° de Factura del Proveedor / N° Transacción
              </label>
              <input
                id="payment-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Pago Fac 0001-00049280 / Transf Banco Galicia"
                className="w-full h-8 px-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-8 px-3 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-8 px-4 rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Registrando...</span>
                  </>
                ) : (
                  <span>Emitir Pago & Imprimir</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
