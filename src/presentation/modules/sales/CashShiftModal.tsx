import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Clock,
} from 'lucide-react';
import { SaleWithDetails } from '@/core/application/ports/ISaleRepository';
import { createClient } from '@/utils/supabase/client';
import { CashShift } from './CashShiftOpenModal';

interface CashShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: SaleWithDetails[];
  companyId: string;
  companyName: string;
  activeShift?: CashShift | null;
  onShiftClosed?: () => void;
}

export function CashShiftModal({
  isOpen,
  onClose,
  sales,
  companyId,
  companyName,
  activeShift,
  onShiftClosed,
}: CashShiftModalProps) {
  const formatLocalDate = (d: Date = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatLocalDate();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [initialCashInput, setInitialCashInput] = useState<string>(
    activeShift ? activeShift.initialCash.toString() : '0'
  );
  const [countedCash, setCountedCash] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState('');
  const [closingShift, setClosingShift] = useState(false);
  const [shiftClosedSuccess, setShiftClosedSuccess] = useState(false);

  // Movimientos de tesorería del día
  const [cashMovements, setCashMovements] = useState<
    Array<{
      id: string;
      movement_type: string;
      category: string;
      amount: number;
      description: string;
      responsible_name?: string;
    }>
  >([]);

  // Cobranzas a cuenta corriente en efectivo
  const [cashPayments, setCashPayments] = useState<
    Array<{
      id: string;
      amount: number;
      receipt_number: string;
    }>
  >([]);

  useEffect(() => {
    if (activeShift) {
      setInitialCashInput(activeShift.initialCash.toString());
    }
  }, [activeShift]);

  // Cargar movimientos manuales y cobranzas en efectivo del día
  useEffect(() => {
    if (!isOpen || !companyId) return;

    let isMounted = true;
    async function loadDayMovements() {
      try {
        const supabase = createClient();

        // 1. Egresos e ingresos manuales
        const { data: movs } = await supabase
          .from('cash_movements')
          .select('id, movement_type, category, amount, description, responsible_name, created_at')
          .eq('company_id', companyId);

        const filteredMovs = (movs || []).filter((m: any) => {
          try {
            return formatLocalDate(new Date(m.created_at)) === selectedDate;
          } catch {
            return m.created_at.slice(0, 10) === selectedDate;
          }
        });

        // 2. Cobranzas en efectivo de clientes
        const { data: pays } = await supabase
          .from('customer_payments')
          .select('id, amount, payment_method, receipt_number, created_at')
          .eq('company_id', companyId)
          .eq('payment_method', 'EFECTIVO');

        const filteredPays = (pays || []).filter((p: any) => {
          try {
            return formatLocalDate(new Date(p.created_at)) === selectedDate;
          } catch {
            return p.created_at.slice(0, 10) === selectedDate;
          }
        });

        if (isMounted) {
          setCashMovements(
            filteredMovs.map((m: any) => ({
              ...m,
              amount: Number(m.amount || 0),
            }))
          );
          setCashPayments(
            filteredPays.map((p: any) => ({
              ...p,
              amount: Number(p.amount || 0),
            }))
          );
        }
      } catch (err) {
        console.error('Error cargando movimientos de caja:', err);
      }
    }

    loadDayMovements();
    return () => {
      isMounted = false;
    };
  }, [isOpen, companyId, selectedDate]);

  if (!isOpen) return null;

  // Filtrar ventas del día seleccionado comparando fecha local
  const dailySales = sales.filter((s) => {
    try {
      return formatLocalDate(new Date(s.createdAt)) === selectedDate;
    } catch {
      return s.createdAt.slice(0, 10) === selectedDate;
    }
  });

  // Totales por medio de pago de ventas de mostrador
  const cashSalesTotal = dailySales
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

  const totalBilledSales = dailySales.reduce((acc, s) => acc + s.totalAmount, 0);

  // Totales de tesorería manual
  const manualIncomes = cashMovements
    .filter((m) => m.movement_type === 'INGRESO')
    .reduce((acc, m) => acc + m.amount, 0);

  const manualExpenses = cashMovements
    .filter((m) => m.movement_type === 'EGRESO')
    .reduce((acc, m) => acc + m.amount, 0);

  const cashPaymentsTotal = cashPayments.reduce((acc, p) => acc + p.amount, 0);

  const numInitialCash = parseFloat(initialCashInput) || 0;

  // Efectivo teórico en cajón = Fondo + Ventas Efectivo + Cobranzas Efectivo + Aportes - Gastos
  const expectedCashInDrawer =
    numInitialCash + cashSalesTotal + cashPaymentsTotal + manualIncomes - manualExpenses;

  const numCountedCash = parseFloat(countedCash) || 0;
  const cashDifference = countedCash !== '' ? numCountedCash - expectedCashInDrawer : 0;

  const handlePrint = () => {
    window.print();
  };

  // Confirmar y asentar cierre formal en la base de datos
  const handleConfirmCloseShift = async () => {
    setClosingShift(true);
    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      if (activeShift) {
        // Actualizar turno existente
        await supabase
          .from('cash_shifts')
          .update({
            status: 'CERRADO',
            initial_cash: numInitialCash,
            counted_cash: numCountedCash,
            expected_cash: expectedCashInDrawer,
            cash_difference: cashDifference,
            notes: closingNotes.trim() || activeShift.notes || null,
            closed_at: now,
          })
          .eq('id', activeShift.id);
      } else {
        // Asentar cierre diario nuevo
        await supabase.from('cash_shifts').insert({
          company_id: companyId,
          shift_type: 'TURNO_UNICO',
          cashier_name: 'Caja Mostrador',
          initial_cash: numInitialCash,
          counted_cash: numCountedCash,
          expected_cash: expectedCashInDrawer,
          cash_difference: cashDifference,
          status: 'CERRADO',
          notes: closingNotes.trim() || null,
          opened_at: now,
          closed_at: now,
        });
      }

      setShiftClosedSuccess(true);
      if (onShiftClosed) onShiftClosed();
    } catch (err) {
      console.error('Error al asentar arqueo de caja:', err);
      alert('Error guardando el arqueo de caja.');
    } finally {
      setClosingShift(false);
    }
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
        className="w-full max-w-3xl bg-white rounded-xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150 font-sans"
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
                Conciliación integral de efectivo, gastos, ventas y cobranzas
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
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
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
                PLANILLA OFICIAL DE ARQUEO Y CIERRE DE CAJA
              </p>
              <p className="text-[11px] text-slate-500">
                Control Comercial Interno • Auditoría de Tesorería
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
              {activeShift && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 mt-1 inline-block">
                  Turno Activo: {activeShift.shiftType.replace('TURNO_', '')} ({activeShift.cashierName})
                </span>
              )}
            </div>
          </div>

          {/* Resumen Principal de Cobros por Medios de Pago */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between text-slate-600 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Efectivo Ventas</span>
                <Banknote className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                ${cashSalesTotal.toLocaleString('es-AR')}
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {dailySales.filter((s) => s.paymentMethod === 'EFECTIVO').length} ventas
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
              <p className="text-[10px] text-slate-500 mt-0.5">Débito y Crédito</p>
            </div>

            <div className="p-3 rounded-lg border-2 border-slate-900 bg-slate-900 text-white">
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80 mb-1">
                Total Facturado
              </span>
              <span className="text-base font-bold font-mono tabular-nums">
                ${totalBilledSales.toLocaleString('es-AR')}
              </span>
              <p className="text-[10px] opacity-80 mt-0.5">{dailySales.length} ventas mostrador</p>
            </div>
          </div>

          {/* Desglose Matemático de Efectivo en Cajón */}
          <div className="p-4 rounded-xl border border-slate-300 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-slate-700" />
                <span>Conciliación Matemática de Efectivo Físico</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono font-normal">
                Fondo + Ingresos - Gastos
              </span>
            </h4>

            {/* Fila con los 4 componentes del efectivo teórico */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">
                  Fondo Inicial (Apertura)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    value={initialCashInput}
                    onChange={(e) => setInitialCashInput(e.target.value)}
                    className="w-full font-mono font-bold text-slate-900 bg-transparent border-0 p-0 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block mb-0.5">
                  (+) Cobros en Efectivo
                </span>
                <span className="font-mono font-bold text-sm text-emerald-900">
                  ${(cashSalesTotal + cashPaymentsTotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[9px] text-emerald-700">Ventas + Recibos Cta. Cte.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-200">
                <span className="text-[10px] text-sky-800 font-bold uppercase block mb-0.5">
                  (+) Aportes Manuales
                </span>
                <span className="font-mono font-bold text-sm text-sky-900">
                  ${manualIncomes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[9px] text-sky-700">{cashMovements.filter((m) => m.movement_type === 'INGRESO').length} ingresos</p>
              </div>

              <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200">
                <span className="text-[10px] text-rose-800 font-bold uppercase block mb-0.5">
                  (-) Egresos / Gastos
                </span>
                <span className="font-mono font-bold text-sm text-rose-900">
                  -${manualExpenses.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[9px] text-rose-700">{cashMovements.filter((m) => m.movement_type === 'EGRESO').length} comprobantes</p>
              </div>
            </div>

            {/* Comparación Teórico vs Real */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 items-center">
              <div className="p-3 rounded-lg bg-slate-100 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                  1. Efectivo Teórico Esperado
                </span>
                <span className="font-mono font-bold text-base text-slate-950 tabular-nums">
                  ${expectedCashInDrawer.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-300">
                <label htmlFor="counted-cash" className="text-[10px] text-slate-800 font-bold uppercase block mb-1">
                  2. Efectivo Real en Cajón *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">$</span>
                  <input
                    id="counted-cash"
                    type="number"
                    min="0"
                    step="any"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    placeholder="Monto contado..."
                    className="w-full h-8 pl-6 pr-2.5 rounded-md border border-slate-300 bg-white font-mono font-bold text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div
                className={`p-3 rounded-lg border flex flex-col justify-between ${
                  countedCash === ''
                    ? 'bg-slate-50 border-slate-200 text-slate-500'
                    : cashDifference === 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : cashDifference > 0
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider block">
                  3. Diferencia de Caja
                </span>
                <span className="font-mono font-bold text-base tabular-nums">
                  {countedCash === ''
                    ? 'Ingrese monto'
                    : `${cashDifference >= 0 ? '+' : ''}$${cashDifference.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                </span>
                <span className="text-[10px] font-semibold mt-0.5">
                  {countedCash === ''
                    ? 'Esperando conteo'
                    : cashDifference === 0
                    ? '✓ Caja Cuadrada Exacta'
                    : cashDifference > 0
                    ? 'Sobrante en Cajón'
                    : 'Faltante en Cajón'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de Gastos y Movimientos de Caja Chica */}
          {cashMovements.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Movimientos de Caja Chica del Día ({cashMovements.length})</span>
                <span className="font-mono font-normal text-[11px] text-slate-500">
                  Neto: ${(manualIncomes - manualExpenses).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                  <tr>
                    <th className="py-1.5 px-3">Tipo</th>
                    <th className="py-1.5 px-3">Rubro</th>
                    <th className="py-1.5 px-3">Concepto</th>
                    <th className="py-1.5 px-3">Responsable</th>
                    <th className="py-1.5 px-3 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cashMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="py-1.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-[10px] px-1.5 py-0.2 rounded border ${
                            m.movement_type === 'EGRESO'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {m.movement_type === 'EGRESO' ? <ArrowDownRight className="w-2.5 h-2.5" /> : <ArrowUpRight className="w-2.5 h-2.5" />}
                          {m.movement_type}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-slate-700 font-medium">{m.category}</td>
                      <td className="py-1.5 px-3 text-slate-800">{m.description}</td>
                      <td className="py-1.5 px-3 text-slate-500 text-[11px]">{m.responsible_name || '-'}</td>
                      <td
                        className={`py-1.5 px-3 text-right font-mono font-bold ${
                          m.movement_type === 'EGRESO' ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {m.movement_type === 'EGRESO' ? '-' : '+'}${m.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Firmas al pie A4 */}
          <div className="pt-8 grid grid-cols-2 gap-12 text-center border-t border-slate-200">
            <div className="border-t border-slate-400 pt-1.5">
              <p className="font-bold text-slate-900 text-[11px] uppercase">{companyName}</p>
              <p className="text-[10px] text-slate-500">Firma del Cajero / Responsable de Turno</p>
            </div>
            <div className="border-t border-slate-400 pt-1.5">
              <p className="font-bold text-slate-900 text-[11px] uppercase">Control Interno</p>
              <p className="text-[10px] text-slate-500">Supervisión / Auditoría de Tesorería</p>
            </div>
          </div>
        </div>

        {/* Footer con Botón de Cierre Formal */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          {shiftClosedSuccess ? (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Arqueo y Cierre asentado correctamente en base de datos</span>
            </span>
          ) : (
            <input
              type="text"
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="Notas u observaciones de cierre (opcional)..."
              className="h-8 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 w-80 bg-white focus:outline-none"
            />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cerrar Ventana
            </button>
            <button
              type="button"
              onClick={handleConfirmCloseShift}
              disabled={countedCash === '' || closingShift || shiftClosedSuccess}
              className="h-8 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {closingShift && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{shiftClosedSuccess ? 'Cierre Guardado' : 'Asentar Cierre de Turno'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
