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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-lg bg-white border border-slate-300 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center">
              <Banknote className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {orderGenerated ? 'Comprobante de Pago a Proveedor' : 'Emitir Pago / Orden de Pago'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 p-1.5 rounded hover:bg-slate-200 transition-colors cursor-pointer"
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
              className="bg-white p-6 border border-slate-300 rounded max-w-md mx-auto space-y-4 text-slate-900 font-sans shadow-sm print:border-none print:shadow-none print:p-0"
            >
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h1 className="text-lg font-black uppercase tracking-tight">{companyName}</h1>
                  <p className="text-[11px] text-slate-500 font-medium">Control de Tesorería & Pagos a Proveedores</p>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">
                    Orden de Pago
                  </div>
                  <p className="text-sm font-black font-mono mt-1 text-slate-900">{orderGenerated.orderNumber}</p>
                  <p className="text-[10px] text-slate-500">{orderGenerated.date}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Proveedor:</span>
                  <span className="font-bold text-slate-900">{supplier.name}</span>
                </div>
                {supplier.taxId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">CUIT:</span>
                    <span className="font-mono text-slate-700">{supplier.taxId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Medio de Pago:</span>
                  <span className="font-semibold text-slate-800">{paymentMethod}</span>
                </div>
              </div>

              <div className="border-t border-b border-slate-300 py-3 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase">Monto Cancelado:</span>
                <span className="text-xl font-black font-mono text-slate-900">
                  ${orderGenerated.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {notes && (
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                  <strong>Concepto / Detalle:</strong> {notes}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-8 text-center text-[10px] text-slate-500">
                <div className="border-t border-slate-300 pt-1">
                  <span className="block font-medium text-slate-700">Emitido por Tesorería</span>
                  <span>Firma y Aclaración</span>
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <span className="block font-medium text-slate-700">Recibió Proveedor</span>
                  <span>Firma o Recibo Oficial</span>
                </div>
              </div>

              <div className="pt-2 text-center text-[9px] text-slate-400">
                DOCUMENTO DE CONTROL COMERCIAL INTERNO • SIN VALIDEZ FISCAL
              </div>
            </div>

            <div className="flex gap-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 h-9 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Comprobante A4</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGeneratePayment} className="p-4 space-y-4">
            {error && (
              <div className="p-3 rounded bg-rose-50 border border-rose-300 text-rose-900 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Datos del Proveedor */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Truck className="w-4 h-4 text-slate-600" />
                <span>{supplier.name}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-200">
                <span>Saldo Pendiente de Pago:</span>
                <span className="font-mono font-bold text-slate-900">
                  ${(supplier.currentBalance ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Monto */}
            <div>
              <label htmlFor="payment-amount" className="block text-xs font-semibold text-slate-700 mb-1">
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
                className="w-full h-9 px-3 rounded bg-white border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* Medio de Pago */}
            <div>
              <label htmlFor="payment-method" className="block text-xs font-semibold text-slate-700 mb-1">
                Medio de Pago
              </label>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full h-8 px-2 rounded bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              >
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="EFECTIVO">Efectivo de Caja</option>
                <option value="CHEQUE">Cheque Propio / Terceros</option>
              </select>
            </div>

            {/* Notas / Observaciones */}
            <div>
              <label htmlFor="payment-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                Concepto / N° de Factura del Proveedor / N° Transacción
              </label>
              <input
                id="payment-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Pago Fac 0001-00049280 / Transf Banco Galicia"
                className="w-full h-8 px-2.5 rounded bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-8 px-3 rounded bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-8 px-4 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
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
