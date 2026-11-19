import React, { useState, useMemo } from 'react';
import {
  X,
  Calculator,
  Banknote,
  ArrowRightLeft,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
} from 'lucide-react';
import { SaleWithDetails } from '@/core/application/ports/ISaleRepository';

interface CashShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: SaleWithDetails[];
  companyName: string;
}

export function CashShiftModal({
  isOpen,
  onClose,
  sales,
  companyName,
}: CashShiftModalProps) {
  // Helper para fecha local (YYYY-MM-DD) sin desfasaje UTC
  const formatLocalDate = (d: Date = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatLocalDate();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [countedCash, setCountedCash] = useState<string>('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  // Filtrar ventas del día seleccionado comparando fecha local
  const dailySales = sales.filter((s) => {
    try {
      return formatLocalDate(new Date(s.createdAt)) === selectedDate;
    } catch {
      return s.createdAt.slice(0, 10) === selectedDate;
    }
  });

  // Totales por medio de pago
  const cashTotal = dailySales
    .filter((s) => s.paymentMethod === 'EFECTIVO')
    .reduce((acc, s) => acc + s.totalAmount, 0);

  const transferTotal = dailySales
    .filter((s) => s.paymentMethod === 'TRANSFERENCIA')
    .reduce((acc, s) => acc + s.totalAmount, 0);

  const debitTotal = dailySales
    .filter((s) => s.paymentMethod === 'TARJETA_DEBITO')
    .reduce((acc, s) => acc + s.totalAmount, 0);

  const creditTotal = dailySales
    .filter((s) => s.paymentMethod === 'TARJETA_CREDITO')
    .reduce((acc, s) => acc + s.totalAmount, 0);

  const otherTotal = dailySales
    .filter(
      (s) =>
        s.paymentMethod !== 'EFECTIVO' &&
        s.paymentMethod !== 'TRANSFERENCIA' &&
        s.paymentMethod !== 'TARJETA_DEBITO' &&
        s.paymentMethod !== 'TARJETA_CREDITO'
    )
    .reduce((acc, s) => acc + s.totalAmount, 0);

  const totalBilled = dailySales.reduce((acc, s) => acc + s.totalAmount, 0);

  const numCountedCash = parseFloat(countedCash) || 0;
  const cashDifference = countedCash !== '' ? numCountedCash - cashTotal : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cash-shift-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera (print:hidden) */}
        <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 id="cash-shift-title" className="text-sm font-bold text-slate-900 leading-none">
                Arqueo y Cierre de Caja Diario
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Control de cobros por turno y conciliación de efectivo en cajón
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Cierre A4</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenido imprimible de Cierre de Caja */}
        <div
          id="printable-a4-voucher"
          className="p-5 sm:p-8 space-y-5 overflow-y-auto flex-1 font-sans text-xs text-slate-900 leading-normal"
        >
          {/* Encabezado del Cierre */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-900" />
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                  {companyName}
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                PLANILLA DE ARQUEO Y CIERRE DE CAJA DIARIA
              </p>
              <p className="text-[11px] text-slate-500">
                Control Comercial Interno • Sin Validez Fiscal
              </p>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 print:justify-end">
                <Calendar className="w-3.5 h-3.5 text-slate-600 print:hidden" />
                <span className="print:hidden">Fecha: </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="font-mono text-xs border border-slate-300 rounded px-2 py-0.5 bg-white font-bold text-slate-900 print:border-none print:p-0"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Generado: {new Date().toLocaleTimeString('es-AR')} hs
              </p>
            </div>
          </div>

          {/* Resumen Principal de Cobros */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between text-slate-600 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Efectivo</span>
                <Banknote className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                ${cashTotal.toLocaleString('es-AR')}
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {dailySales.filter((s) => s.paymentMethod === 'EFECTIVO').length} operaciones
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between text-slate-600 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Transferencias</span>
                <ArrowRightLeft className="w-3.5 h-3.5 text-sky-700" />
              </div>
              <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                ${transferTotal.toLocaleString('es-AR')}
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {dailySales.filter((s) => s.paymentMethod === 'TRANSFERENCIA').length} operaciones
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between text-slate-600 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Tarjetas</span>
                <CreditCard className="w-3.5 h-3.5 text-purple-700" />
              </div>
              <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                ${(debitTotal + creditTotal).toLocaleString('es-AR')}
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Débito / Crédito
              </p>
            </div>

            <div className="p-3 rounded-lg border-2 border-slate-900 bg-slate-900 text-white">
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80 mb-1">
                Total Facturado
              </span>
              <span className="text-base font-bold font-mono tabular-nums">
                ${totalBilled.toLocaleString('es-AR')}
              </span>
              <p className="text-[10px] opacity-80 mt-0.5">
                {dailySales.length} ventas asentadas
              </p>
            </div>
          </div>

          {/* Cuadro de Arqueo Físico de Efectivo */}
          <div className="p-4 rounded-xl border border-slate-300 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Banknote className="w-4 h-4 text-slate-700" />
              <span>Conciliación de Efectivo en Cajón</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="text-[11px] text-slate-500 font-semibold uppercase block mb-1">
                  1. Efectivo Teórico (Sistema)
                </label>
                <div className="h-9 px-3 rounded-lg bg-slate-100 border border-slate-200 flex items-center font-mono font-bold text-sm text-slate-900 tabular-nums">
                  ${cashTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <label htmlFor="counted-cash" className="text-[11px] text-slate-700 font-bold uppercase block mb-1">
                  2. Efectivo Real en Cajón *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-500">$</span>
                  <input
                    id="counted-cash"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    className="w-full h-9 pl-7 pr-3 rounded-lg border-2 border-slate-900 bg-white font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 font-semibold uppercase block mb-1">
                  3. Diferencia de Caja
                </span>
                <div
                  className={`h-9 px-3 rounded-lg border flex items-center justify-between font-mono font-bold text-xs ${
                    countedCash === ''
                      ? 'bg-slate-50 border-slate-200 text-slate-400'
                      : cashDifference === 0
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : cashDifference > 0
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                      : 'bg-rose-100 border-rose-400 text-rose-900'
                  }`}
                >
                  <span>
                    {countedCash === ''
                      ? 'Pendiente de contar'
                      : cashDifference === 0
                      ? 'Caja Cuadrada'
                      : cashDifference > 0
                      ? 'Sobrante (+)'
                      : 'Faltante (-)'}
                  </span>
                  {countedCash !== '' && (
                    <span className="text-sm tabular-nums">
                      {cashDifference >= 0 ? '+' : ''}${Math.round(cashDifference).toLocaleString('es-AR')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {countedCash !== '' && cashDifference !== 0 && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  cashDifference > 0
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {cashDifference > 0
                    ? `Se encontraron $${Math.round(cashDifference).toLocaleString('es-AR')} de más respecto al total de tickets cobrados en efectivo.`
                    : `Faltan $${Math.abs(Math.round(cashDifference)).toLocaleString('es-AR')} en el cajón respecto al total registrado en el sistema.`}
                </span>
              </div>
            )}
          </div>

          {/* Observaciones del Cierre */}
          <div>
            <label htmlFor="shift-notes" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Observaciones del Turno / Incidencias:
            </label>
            <input
              id="shift-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Cambio inicial de $10.000 incluido, retiro parcial a las 14hs..."
              className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          {/* Listado breve de tickets del día */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[11px] uppercase">
                <tr>
                  <th className="py-2 px-3">Hora</th>
                  <th className="py-2 px-3">Comprobante</th>
                  <th className="py-2 px-3">Cliente</th>
                  <th className="py-2 px-3 text-center">Medio</th>
                  <th className="py-2 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailySales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500 italic">
                      No se registraron ventas en la fecha seleccionada ({selectedDate}).
                    </td>
                  </tr>
                ) : (
                  dailySales.map((s) => (
                    <tr key={s.id}>
                      <td className="py-1.5 px-3 font-mono text-slate-500 text-[11px]">
                        {new Date(s.createdAt).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-1.5 px-3 font-mono font-semibold text-slate-800">
                        {s.saleNumber}
                      </td>
                      <td className="py-1.5 px-3 text-slate-700">{s.customerName}</td>
                      <td className="py-1.5 px-3 text-center">
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {s.paymentMethod}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        ${s.totalAmount.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Firmas de Cierre */}
          <div className="pt-6 grid grid-cols-2 gap-10 text-center border-t border-slate-200">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-900 text-xs">Firma del Cajero / Responsable</p>
              <p className="text-[10px] text-slate-500">Rendición de dinero</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-900 text-xs">Firma de Administración / Dueño</p>
              <p className="text-[10px] text-slate-500">Recepción y arqueo conforme</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
