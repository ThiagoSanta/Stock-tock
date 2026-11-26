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
    <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
              Control Preventivo de Vencimientos (FIFO)
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Lotes activos con fecha de caducidad en los depósitos
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setFilterRange('ALL')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              filterRange === 'ALL'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Todos ({lots.length})
          </button>
          {expiredCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterRange('EXPIRED')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                filterRange === 'EXPIRED'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
              }`}
            >
              Vencidos ({expiredCount})
            </button>
          )}
          {next30Count > 0 && (
            <button
              type="button"
              onClick={() => setFilterRange('30')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                filterRange === '30'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
              }`}
            >
              ≤ 30 días ({next30Count})
            </button>
          )}
          {next60Count > 0 && (
            <button
              type="button"
              onClick={() => setFilterRange('60')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                filterRange === '60'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
              }`}
            >
              ≤ 60 días ({next30Count + next60Count})
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 uppercase text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
            <tr>
              <th className="py-2.5 px-3">Lote & SKU</th>
              <th className="py-2.5 px-3">Producto</th>
              <th className="py-2.5 px-3">Depósito</th>
              <th className="py-2.5 px-3 text-center">Vencimiento</th>
              <th className="py-2.5 px-3 text-center">Plazo</th>
              <th className="py-2.5 px-3 text-right">Cantidad</th>
              <th className="py-2.5 px-3 text-right">Valuación en Riesgo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {filteredLots.map((item) => {
              const isExpired = item.daysRemaining < 0;
              const isUrgent = item.daysRemaining >= 0 && item.daysRemaining <= 30;

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors ${
                    isExpired
                      ? 'bg-rose-50/50 dark:bg-rose-950/20'
                      : isUrgent
                        ? 'bg-amber-50/40 dark:bg-amber-950/20'
                        : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {item.lot_number}
                    <span className="block text-[11px] font-normal text-zinc-500 dark:text-zinc-400 font-sans">
                      {item.product_sku}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">{item.product_name}</td>
                  <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">{item.warehouse_name}</td>
                  <td className="py-2.5 px-3 text-center font-mono dark:text-zinc-300">
                    {new Date(item.expiry_date + 'T00:00:00').toLocaleDateString('es-AR')}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        <AlertCircle className="w-3 h-3" /> VENCIDO
                      </span>
                    ) : isUrgent ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <AlertTriangle className="w-3 h-3" /> {item.daysRemaining} días
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {item.daysRemaining} días
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {item.current_quantity.toLocaleString('es-AR')} un.
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-800 dark:text-zinc-200">
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
