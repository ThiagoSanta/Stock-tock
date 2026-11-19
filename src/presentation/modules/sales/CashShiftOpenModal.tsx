import React, { useState } from 'react';
import { X, Banknote, User, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export interface CashShift {
  id: string;
  companyId: string;
  shiftType: string;
  cashierName: string;
  initialCash: number;
  countedCash?: number;
  expectedCash?: number;
  cashDifference?: number;
  status: 'ABIERTO' | 'CERRADO';
  notes?: string;
  openedAt: string;
  closedAt?: string;
}

interface CashShiftOpenModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onShiftOpened: (shift: CashShift) => void;
}

export function CashShiftOpenModal({
  isOpen,
  onClose,
  companyId,
  onShiftOpened,
}: CashShiftOpenModalProps) {
  const [shiftType, setShiftType] = useState<'TURNO_MANANA' | 'TURNO_TARDE' | 'TURNO_UNICO'>('TURNO_MANANA');
  const [cashierName, setCashierName] = useState('Cajero Principal');
  const [initialCash, setInitialCash] = useState('20000');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numInitialCash = parseFloat(initialCash) || 0;

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashierName.trim()) {
      setError('Debes ingresar el nombre del cajero responsable.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: insertErr } = await supabase
        .from('cash_shifts')
        .insert({
          company_id: companyId,
          shift_type: shiftType,
          cashier_name: cashierName.trim(),
          initial_cash: numInitialCash,
          status: 'ABIERTO',
          notes: notes.trim() || null,
        })
        .select('*')
        .single();

      if (insertErr || !data) throw new Error(insertErr?.message || 'Error al abrir el turno');

      const mappedShift: CashShift = {
        id: data.id,
        companyId: data.company_id,
        shiftType: data.shift_type,
        cashierName: data.cashier_name,
        initialCash: Number(data.initial_cash || 0),
        status: data.status,
        notes: data.notes,
        openedAt: data.opened_at,
      };

      onShiftOpened(mappedShift);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al registrar la apertura de turno.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shift-open-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <h3 id="shift-open-title" className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Apertura de Turno y Fondo de Caja
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleOpenShift} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Turno */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Turno de Trabajo</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'TURNO_MANANA', label: 'Mañana' },
                { id: 'TURNO_TARDE', label: 'Tarde' },
                { id: 'TURNO_UNICO', label: 'Completo' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setShiftType(t.id as any)}
                  className={`h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    shiftType === t.id
                      ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cajero */}
          <div>
            <label htmlFor="shift-cashier" className="block text-xs font-semibold text-slate-700 mb-1">
              Cajero Responsable *
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="shift-cashier"
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                placeholder="Nombre del cajero..."
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Fondo Inicial de Cambio */}
          <div>
            <label htmlFor="shift-fund" className="block text-xs font-semibold text-slate-700 mb-1">
              Fondo de Cambio Inicial en Cajón ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">$</span>
              <input
                id="shift-fund"
                type="number"
                min="0"
                step="any"
                value={initialCash}
                onChange={(e) => setInitialCash(e.target.value)}
                placeholder="0.00"
                className="w-full h-9 pl-7 pr-3 rounded-lg border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Efectivo físico disponible para dar cambio antes de iniciar las ventas.
            </p>
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="shift-notes" className="block text-xs font-semibold text-slate-700 mb-1">
              Observaciones (Opcional)
            </label>
            <input
              id="shift-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Billetes chicos para cambio..."
              className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-8 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!cashierName.trim() || submitting}
              className="h-8 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Abrir Turno</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
