import React, { useState } from 'react';
import { X, DollarSign, Printer, CheckCircle2, Building2, User, Banknote } from 'lucide-react';
import { CustomerWithMetrics } from '@/core/domain/contacts/types';

interface CustomerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerWithMetrics | null;
  companyName: string;
}

export function CustomerPaymentModal({
  isOpen,
  onClose,
  customer,
  companyName,
}: CustomerPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
  const [notes, setNotes] = useState('');
  const [receiptGenerated, setReceiptGenerated] = useState<{
    receiptNumber: string;
    amount: number;
    date: string;
  } | null>(null);

  if (!isOpen || !customer) return null;

  const numAmount = parseFloat(amount) || 0;

  const handleGenerateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    setReceiptGenerated({
      receiptNumber: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      amount: numAmount,
      date: new Date().toLocaleString('es-AR'),
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera modal */}
        <div className="h-13 px-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 id="payment-modal-title" className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Registrar Cobranza / Recibo a Cuenta
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {receiptGenerated ? (
          <div className="p-6 space-y-5">
            {/* Contenedor imprimible del recibo */}
            <div
              id="printable-a4-voucher"
              className="p-6 rounded-xl border-2 border-slate-900 bg-white space-y-4 font-sans text-xs text-slate-900 leading-normal"
            >
              <div className="flex items-start justify-between pb-4 border-b border-slate-300">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase">{companyName}</h4>
                  <p className="text-[11px] text-slate-500">Recibo de Cobranza y Pago a Cuenta</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                    {receiptGenerated.receiptNumber}
                  </span>
                  <p className="text-[11px] font-mono text-slate-500 mt-1">{receiptGenerated.date}</p>
                </div>
              </div>

              <div className="space-y-2 py-2">
                <p>
                  Recibimos de: <strong className="font-bold text-slate-900 text-sm">{customer.name}</strong>
                  {customer.taxId && <span className="text-slate-500 font-mono"> (DNI/CUIT: {customer.taxId})</span>}
                </p>
                <div className="flex items-baseline justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono">
                  <span className="text-xs font-sans text-slate-600 font-semibold uppercase">Monto Percibido:</span>
                  <span className="text-lg font-bold text-slate-900 tabular-nums">
                    ${receiptGenerated.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Medio de Cobro: <strong className="text-slate-900 font-semibold font-mono">{paymentMethod}</strong>
                  {notes && ` • Observaciones: ${notes}`}
                </p>
              </div>

              <div className="pt-6 grid grid-cols-2 gap-8 text-center border-t border-slate-200">
                <div className="border-t border-slate-400 pt-1.5">
                  <p className="font-bold text-slate-900 text-[11px]">Firma de Caja / Administración</p>
                  <p className="text-[10px] text-slate-500">Cobranza asentada</p>
                </div>
                <div className="border-t border-slate-400 pt-1.5">
                  <p className="font-bold text-slate-900 text-[11px]">Firma de Quien Entrega el Pago</p>
                  <p className="text-[10px] text-slate-500">Constancia de entrega</p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-center gap-2 pt-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="h-8 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Recibo A4</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerateReceipt} className="p-5 space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Cliente Seleccionado
              </span>
              <p className="text-sm font-bold text-slate-900">{customer.name}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                {customer.phone || customer.email || (customer.taxId ? `CUIT: ${customer.taxId}` : 'Sin datos de contacto')}
              </p>
            </div>

            <div>
              <label htmlFor="pay-amount" className="block text-xs font-semibold text-slate-700 mb-1">
                Monto Recibido ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-500">$</span>
                <input
                  id="pay-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-9 pl-7 pr-3 rounded-lg border-2 border-slate-900 bg-white font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medio de Cobro
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                  { id: 'TRANSFERENCIA', label: 'Transferencia Bancaria', icon: DollarSign },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="pay-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                Concepto / Observaciones (Opcional)
              </label>
              <input
                id="pay-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Pago a cuenta de compras de la semana..."
                className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={numAmount <= 0}
                className="h-8 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Emitir Recibo de Pago A4
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
