import React, { useState } from 'react';
import {
  X,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  CheckCircle2,
  Building2,
  Loader2,
  Receipt,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export interface CashMovement {
  id: string;
  companyId: string;
  movementType: 'INGRESO' | 'EGRESO';
  category: string;
  amount: number;
  description: string;
  voucherNumber: string;
  responsibleName?: string;
  createdAt: string;
}

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  onMovementCreated: () => void;
}

const EXPENSE_CATEGORIES = [
  { id: 'FLETE', label: 'Fletes & Envíos' },
  { id: 'LIMPIEZA_INSUMOS', label: 'Insumos & Limpieza' },
  { id: 'VIATICOS_COMIDA', label: 'Viáticos & Comida' },
  { id: 'RETIRO_DUENO', label: 'Retiro de Ganancias / Socio' },
  { id: 'MANTENIMIENTO', label: 'Mantenimiento / Reparación' },
  { id: 'VARIOS', label: 'Otros Gastos Menores' },
];

const INCOME_CATEGORIES = [
  { id: 'APORTE_CAPITAL', label: 'Aporte de Capital / Fondo Extra' },
  { id: 'VUELTO_RECUPERADO', label: 'Vuelto Recuperado' },
  { id: 'OTROS_INGRESOS', label: 'Otros Ingresos a Caja' },
];

export function CashMovementModal({
  isOpen,
  onClose,
  companyId,
  companyName,
  onMovementCreated,
}: CashMovementModalProps) {
  const [movementType, setMovementType] = useState<'EGRESO' | 'INGRESO'>('EGRESO');
  const [category, setCategory] = useState<string>('FLETE');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [responsibleName, setResponsibleName] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [receiptGenerated, setReceiptGenerated] = useState<{
    voucherNumber: string;
    type: 'EGRESO' | 'INGRESO';
    categoryLabel: string;
    amount: number;
    description: string;
    responsibleName: string;
    date: string;
  } | null>(null);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('El monto del movimiento debe ser superior a 0.');
      return;
    }
    if (!description.trim()) {
      setError('Debes ingresar un concepto o descripción para el movimiento.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const voucherNumber = `MOV-${Math.floor(100000 + Math.random() * 900000)}`;
      const activeCategoryList = movementType === 'EGRESO' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
      const catObj = activeCategoryList.find((c) => c.id === category);
      const categoryLabel = catObj?.label || category;

      const { error: insertErr } = await supabase.from('cash_movements').insert({
        company_id: companyId,
        movement_type: movementType,
        category,
        amount: numAmount,
        description: description.trim(),
        voucher_number: voucherNumber,
        responsible_name: responsibleName.trim() || 'Caja Mostrador',
      });

      if (insertErr) throw new Error(insertErr.message);

      setReceiptGenerated({
        voucherNumber,
        type: movementType,
        categoryLabel,
        amount: numAmount,
        description: description.trim(),
        responsibleName: responsibleName.trim() || 'Caja Mostrador',
        date: new Date().toLocaleString('es-AR'),
      });

      onMovementCreated();
    } catch (err: any) {
      setError(err?.message || 'Error al registrar el movimiento de caja.');
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
      aria-labelledby="cash-mov-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50 dark:bg-zinc-950 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <h3 id="cash-mov-title" className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Movimiento de Caja Chica / Tesorería
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pantalla con Comprobante Generado */}
        {receiptGenerated ? (
          <div className="p-6 space-y-4">
            <div
              id="printable-a4-voucher"
              className="p-6 rounded-xl border-2 border-zinc-900 bg-white dark:bg-zinc-900 space-y-4 font-sans text-xs text-zinc-900 dark:text-zinc-100 leading-normal"
            >
              <div className="flex items-start justify-between pb-3 border-b border-zinc-300 dark:border-zinc-700">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase">{companyName}</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Comprobante Interno de {receiptGenerated.type === 'EGRESO' ? 'Salida de Caja (Gasto)' : 'Ingreso a Caja'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-zinc-900 text-white">
                    {receiptGenerated.voucherNumber}
                  </span>
                  <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-1">{receiptGenerated.date}</p>
                </div>
              </div>

              <div className="space-y-2 py-2">
                <p>
                  Tipo de Operación:{' '}
                  <strong
                    className={`font-bold ${
                      receiptGenerated.type === 'EGRESO' ? 'text-rose-800 dark:text-rose-300' : 'text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    {receiptGenerated.type === 'EGRESO' ? 'EGRESO DE DINERO (GASTO)' : 'INGRESO DE DINERO (APORTE)'}
                  </strong>
                </p>
                <p>
                  Rubro / Categoría: <strong className="text-zinc-900 dark:text-zinc-100">{receiptGenerated.categoryLabel}</strong>
                </p>
                <p>
                  Importe:{' '}
                  <strong className="font-mono text-base font-bold text-zinc-950">
                    ${receiptGenerated.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </strong>
                </p>
                <p className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
                  Concepto: <em>{receiptGenerated.description}</em>
                </p>
                <p>
                  Persona Responsable: <strong className="text-zinc-900 dark:text-zinc-100">{receiptGenerated.responsibleName}</strong>
                </p>
              </div>

              <div className="pt-6 grid grid-cols-2 gap-8 text-center border-t border-zinc-200 dark:border-zinc-800">
                <div className="border-t border-zinc-400 pt-1.5">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">Firma de Caja Mostrador</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Asentado en tesorería</p>
                </div>
                <div className="border-t border-zinc-400 pt-1.5">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">Firma de Quien Recibe / Entrega</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Conformidad de entrega</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="h-8 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Comprobante A4</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-xs text-rose-800 dark:text-rose-300">
                {error}
              </div>
            )}

            {/* Selector de Tipo: Egreso o Ingreso */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tipo de Movimiento</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMovementType('EGRESO');
                    setCategory('FLETE');
                  }}
                  className={`h-9 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    movementType === 'EGRESO'
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-300 shadow-2xs'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                  <span>Egreso / Gasto de Caja</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMovementType('INGRESO');
                    setCategory('APORTE_CAPITAL');
                  }}
                  className={`h-9 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    movementType === 'INGRESO'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  <span>Ingreso / Aporte a Caja</span>
                </button>
              </div>
            </div>

            {/* Rubro / Categoría */}
            <div>
              <label htmlFor="mov-cat" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Rubro o Destino
              </label>
              <select
                id="mov-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:border-zinc-900"
              >
                {(movementType === 'EGRESO' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Monto */}
            <div>
              <label htmlFor="mov-amount" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Monto en Efectivo ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-zinc-400 dark:text-zinc-500">
                  $
                </span>
                <input
                  id="mov-amount"
                  type="number"
                  min="0"
                  step="any"
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-9 pl-7 pr-3 rounded-lg border border-zinc-300 dark:border-zinc-700 font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="mov-desc" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Concepto / Motivo detallado *
              </label>
              <input
                id="mov-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Pago de flete por entrega de mercadería..."
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
              />
            </div>

            {/* Responsable */}
            <div>
              <label htmlFor="mov-resp" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Persona Responsable / Receptor (Opcional)
              </label>
              <input
                id="mov-resp"
                type="text"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                placeholder="Ej: Cadete Juan Pérez / Socio Lucas"
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-8 px-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={numAmount <= 0 || !description.trim() || submitting}
                className="h-8 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{submitting ? 'Guardando...' : 'Asentar Movimiento en Caja'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
