import React, { useState, useEffect, useMemo } from 'react';
import { X, Layers, Plus, Trash2, AlertTriangle, ChevronDown, Calendar } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getCompanyContext } from '@/utils/supabase/companyContext';

interface StockLot {
  id: string;
  lot_number: string;
  expiry_date: string | null;
  initial_quantity: number;
  current_quantity: number;
  unit_cost: number;
  notes: string | null;
  created_at: string;
  warehouse_id: string;
  warehouse_name?: string;
}

interface LotManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productSku: string;
}

function formatLocalDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function daysUntilExpiry(expiry: string | null): number | null {
  if (!expiry) return null;
  const now = new Date();
  const exp = new Date(expiry + 'T00:00:00');
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ expiry }: { expiry: string | null }) {
  if (!expiry) return <span className="text-slate-400 text-xs">Sin venc.</span>;
  const days = daysUntilExpiry(expiry)!;
  if (days < 0) return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">VENCIDO</span>;
  if (days <= 30) return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700"><AlertTriangle className="w-3 h-3" />{days}d</span>;
  if (days <= 90) return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700">{days}d</span>;
  return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700">{formatLocalDate(expiry)}</span>;
}

export function LotManagementModal({
  isOpen,
  onClose,
  productId,
  productName,
  productSku,
}: LotManagementModalProps) {
  const [lots, setLots] = useState<StockLot[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState('');
  const [defaultWarehouseId, setDefaultWarehouseId] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    lot_number: '',
    expiry_date: '',
    initial_quantity: '',
    unit_cost: '',
    warehouse_id: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const loadLots = async () => {
    setLoading(true);
    try {
      const ctx = await getCompanyContext();
      if (!ctx) return;
      setCompanyId(ctx.companyId);
      setDefaultWarehouseId(ctx.defaultWarehouseId);

      const [lotsRes, whRes] = await Promise.all([
        supabase
          .from('stock_lots')
          .select('*, warehouses(name)')
          .eq('company_id', ctx.companyId)
          .eq('product_id', productId)
          .order('expiry_date', { ascending: true }),
        supabase
          .from('warehouses')
          .select('id, name')
          .eq('company_id', ctx.companyId)
          .eq('active', true),
      ]);

      if (lotsRes.data) {
        setLots(lotsRes.data.map((l: any) => ({
          ...l,
          warehouse_name: l.warehouses?.name ?? '—',
        })));
      }
      if (whRes.data) setWarehouses(whRes.data);
      setForm((f) => ({ ...f, warehouse_id: ctx.defaultWarehouseId }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && productId) loadLots();
  }, [isOpen, productId]);

  const handleSaveLot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.lot_number.trim()) { setError('El número de lote es obligatorio.'); return; }
    if (!form.initial_quantity || parseFloat(form.initial_quantity) <= 0) { setError('La cantidad inicial debe ser mayor a 0.'); return; }
    if (!form.warehouse_id) { setError('Seleccioná un depósito.'); return; }

    setSaving(true);
    try {
      const { error: err } = await supabase.from('stock_lots').insert({
        company_id: companyId,
        warehouse_id: form.warehouse_id,
        product_id: productId,
        lot_number: form.lot_number.trim().toUpperCase(),
        expiry_date: form.expiry_date || null,
        initial_quantity: parseFloat(form.initial_quantity),
        current_quantity: parseFloat(form.initial_quantity),
        unit_cost: parseFloat(form.unit_cost) || 0,
        notes: form.notes.trim() || null,
      });
      if (err) throw err;
      setForm({ lot_number: '', expiry_date: '', initial_quantity: '', unit_cost: '', warehouse_id: defaultWarehouseId, notes: '' });
      setShowForm(false);
      await loadLots();
    } catch (err: any) {
      setError(err.message || 'Error al guardar lote.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLot = async (lotId: string) => {
    if (!confirm('¿Eliminar este lote? Esta acción no se puede deshacer.')) return;
    await supabase.from('stock_lots').delete().eq('id', lotId);
    await loadLots();
  };

  // Sort FIFO by expiry (nulls last)
  const sortedLots = useMemo(() => {
    return [...lots].sort((a, b) => {
      if (!a.expiry_date && !b.expiry_date) return 0;
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;
      return a.expiry_date.localeCompare(b.expiry_date);
    });
  }, [lots]);

  const totalQty = lots.reduce((s, l) => s + l.current_quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Control de Lotes — {productName}</h2>
              <p className="text-xs text-slate-500">SKU: {productSku} · {totalQty} u. en {lots.length} lote{lots.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* FIFO Note */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Los lotes se despachan en orden <strong>FIFO</strong> (el que vence primero, primero en salir). Están ordenados por fecha de vencimiento.</span>
          </div>

          {/* Lots Table */}
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Cargando lotes...</div>
          ) : sortedLots.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">Este producto no tiene lotes registrados.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Lote</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Depósito</th>
                    <th className="px-3 py-2 text-center font-semibold text-slate-700">Vencimiento</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700">Cant. Inicial</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700">Disponible</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-700">Costo Unit.</th>
                    <th className="px-3 py-2 text-center font-semibold text-slate-700">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLots.map((lot, idx) => (
                    <tr key={lot.id} className={`border-b border-slate-100 ${idx === 0 && lot.current_quantity > 0 ? 'bg-emerald-50' : ''}`}>
                      <td className="px-3 py-2 font-mono font-bold text-slate-900">{lot.lot_number}</td>
                      <td className="px-3 py-2 text-slate-600">{lot.warehouse_name}</td>
                      <td className="px-3 py-2 text-center"><ExpiryBadge expiry={lot.expiry_date} /></td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700">{lot.initial_quantity.toLocaleString('es-AR')}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{lot.current_quantity.toLocaleString('es-AR')}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-600">
                        ${lot.unit_cost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleDeleteLot(lot.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar lote"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-xs font-semibold text-slate-700">Total</td>
                    <td className="px-3 py-2 text-right font-mono font-black text-slate-900">{totalQty.toLocaleString('es-AR')}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Add Lot Form */}
          {showForm ? (
            <form onSubmit={handleSaveLot} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
              <p className="text-xs font-bold text-slate-700">Registrar nuevo lote</p>
              {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Nº de Lote *</label>
                  <input
                    value={form.lot_number}
                    onChange={(e) => setForm((f) => ({ ...f, lot_number: e.target.value }))}
                    placeholder="LOT-001"
                    className="w-full h-8 px-2 rounded border border-slate-300 text-xs focus:outline-none focus:border-slate-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
                    className="w-full h-8 px-2 rounded border border-slate-300 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Cantidad inicial *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.initial_quantity}
                    onChange={(e) => setForm((f) => ({ ...f, initial_quantity: e.target.value }))}
                    placeholder="0"
                    className="w-full h-8 px-2 rounded border border-slate-300 text-xs focus:outline-none focus:border-slate-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Costo unitario</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unit_cost}
                    onChange={(e) => setForm((f) => ({ ...f, unit_cost: e.target.value }))}
                    placeholder="0.00"
                    className="w-full h-8 px-2 rounded border border-slate-300 text-xs focus:outline-none focus:border-slate-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Depósito *</label>
                  <div className="relative">
                    <select
                      value={form.warehouse_id}
                      onChange={(e) => setForm((f) => ({ ...f, warehouse_id: e.target.value }))}
                      className="w-full h-8 pl-2 pr-6 rounded border border-slate-300 text-xs bg-white appearance-none focus:outline-none focus:border-slate-900"
                    >
                      <option value="">Seleccionar...</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Notas (opcional)</label>
                  <input
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Observaciones del lote..."
                    className="w-full h-8 px-2 rounded border border-slate-300 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="h-8 px-3 rounded border border-slate-300 text-xs hover:bg-slate-100 transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="h-8 px-4 rounded bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 cursor-pointer transition-colors">
                  {saving ? 'Guardando...' : 'Registrar Lote'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full h-9 rounded-lg border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Registrar nuevo lote / recepción
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
          <p className="text-xs text-slate-400">Control comercial interno · Sin validez fiscal</p>
          <button onClick={onClose} className="h-8 px-4 rounded border border-slate-300 bg-white text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
