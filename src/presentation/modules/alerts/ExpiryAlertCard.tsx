import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, AlertTriangle, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface ExpiringLot {
  id: string;
  lot_number: string;
  expiry_date: string;
  current_quantity: number;
  unit_cost: number;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
  daysRemaining: number;
}

export function ExpiryAlertCard({ companyId }: { companyId: string }) {
  const [lots, setLots] = useState<ExpiringLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRange, setFilterRange] = useState<'ALL' | 'EXPIRED' | '30' | '60' | '90'>('ALL');

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!companyId) return;

    const fetchLots = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('stock_lots')
          .select(`
            id,
            lot_number,
            expiry_date,
            current_quantity,
            unit_cost,
            products (name, sku),
            warehouses (name)
          `)
          .eq('company_id', companyId)
          .gt('current_quantity', 0)
          .not('expiry_date', 'is', null)
          .order('expiry_date', { ascending: true });

        if (error) throw error;

        const now = new Date();
        const mapped: ExpiringLot[] = (data || []).map((l: any) => {
          const exp = new Date(l.expiry_date + 'T00:00:00');
          const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: l.id,
            lot_number: l.lot_number,
            expiry_date: l.expiry_date,
            current_quantity: Number(l.current_quantity),
            unit_cost: Number(l.unit_cost),
            product_name: l.products?.name || 'Producto',
            product_sku: l.products?.sku || '—',
            warehouse_name: l.warehouses?.name || 'Depósito',
            daysRemaining: days,
          };
        });

        setLots(mapped);
      } catch (err) {
        console.error('Error cargando lotes con vencimiento:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLots();
  }, [companyId]);

  const expiredCount = lots.filter((l) => l.daysRemaining < 0).length;
  const next30Count = lots.filter((l) => l.daysRemaining >= 0 && l.daysRemaining <= 30).length;
  const next60Count = lots.filter((l) => l.daysRemaining > 30 && l.daysRemaining <= 60).length;
  const next90Count = lots.filter((l) => l.daysRemaining > 60 && l.daysRemaining <= 90).length;

  const filteredLots = useMemo(() => {
    if (filterRange === 'EXPIRED') return lots.filter((l) => l.daysRemaining < 0);
    if (filterRange === '30') return lots.filter((l) => l.daysRemaining >= 0 && l.daysRemaining <= 30);
    if (filterRange === '60') return lots.filter((l) => l.daysRemaining >= 0 && l.daysRemaining <= 60);
    if (filterRange === '90') return lots.filter((l) => l.daysRemaining >= 0 && l.daysRemaining <= 90);
    return lots;
  }, [lots, filterRange]);

  if (loading) return null;
  if (lots.length === 0) return null;

  return (
    <div className="rounded-lg bg-white border border-slate-200 p-4 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-amber-500 text-white flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Control Preventivo de Vencimientos (FIFO)
            </h3>
            <p className="text-[11px] text-slate-500">
              Lotes activos con fecha de caducidad en los depósitos
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setFilterRange('ALL')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              filterRange === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({lots.length})
          </button>
          {expiredCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterRange('EXPIRED')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                filterRange === 'EXPIRED' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
              }`}
            >
              Vencidos ({expiredCount})
            </button>
          )}
          {next30Count > 0 && (
            <button
              type="button"
              onClick={() => setFilterRange('30')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                filterRange === '30' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              ≤ 30 días ({next30Count})
            </button>
          )}
          {next60Count > 0 && (
            <button
              type="button"
              onClick={() => setFilterRange('60')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                filterRange === '60' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              ≤ 60 días ({next30Count + next60Count})
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-600">
            <tr>
              <th className="py-2 px-3">Lote & SKU</th>
              <th className="py-2 px-3">Producto</th>
              <th className="py-2 px-3">Depósito</th>
              <th className="py-2 px-3 text-center">Vencimiento</th>
              <th className="py-2 px-3 text-center">Plazo</th>
              <th className="py-2 px-3 text-right">Cantidad</th>
              <th className="py-2 px-3 text-right">Valuación en Riesgo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLots.map((item) => {
              const isExpired = item.daysRemaining < 0;
              const isUrgent = item.daysRemaining >= 0 && item.daysRemaining <= 30;

              return (
                <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isExpired ? 'bg-rose-50/50' : isUrgent ? 'bg-amber-50/40' : ''}`}>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">
                    {item.lot_number}
                    <span className="block text-[11px] font-normal text-slate-500 font-sans">{item.product_sku}</span>
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{item.product_name}</td>
                  <td className="py-2 px-3 text-slate-600">{item.warehouse_name}</td>
                  <td className="py-2 px-3 text-center font-mono">
                    {new Date(item.expiry_date + 'T00:00:00').toLocaleDateString('es-AR')}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                        <AlertCircle className="w-3 h-3" /> VENCIDO
                      </span>
                    ) : isUrgent ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-3 h-3" /> {item.daysRemaining} días
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {item.daysRemaining} días
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {item.current_quantity.toLocaleString('es-AR')} un.
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                    ${(item.current_quantity * item.unit_cost).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
