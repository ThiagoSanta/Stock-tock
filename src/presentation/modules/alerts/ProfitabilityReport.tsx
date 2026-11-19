import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  DollarSign,
  PieChart,
  Layers,
  ArrowUpRight,
  Loader2,
  Calendar,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface ProductProfitMetrics {
  productId: string;
  name: string;
  category: string;
  unitsSold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercentage: number;
}

interface CategoryProfitMetrics {
  category: string;
  unitsSold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercentage: number;
}

interface ProfitabilityReportProps {
  companyId: string;
}

export function ProfitabilityReport({ companyId }: ProfitabilityReportProps) {
  const [loading, setLoading] = useState(true);
  const [activeRankView, setActiveRankView] = useState<'VOLUME' | 'PROFIT' | 'CATEGORIES'>('PROFIT');
  const [productsMetrics, setProductsMetrics] = useState<ProductProfitMetrics[]>([]);
  const [timeFilter, setTimeFilter] = useState<'ALL' | '30DAYS' | '7DAYS'>('ALL');

  useEffect(() => {
    if (!companyId) return;

    let isMounted = true;
    async function loadProfitability() {
      setLoading(true);
      try {
        const supabase = createClient();

        // Obtener todas las ventas y sus ítems con costo histórico
        const { data: salesData, error: salesErr } = await supabase
          .from('sales')
          .select(`
            id,
            total_amount,
            total_cost,
            created_at,
            items:sale_items(
              product_id,
              quantity,
              unit_price,
              historical_cost_price,
              subtotal,
              product:products(name, category:categories(name))
            )
          `)
          .eq('company_id', companyId);

        if (salesErr || !salesData) {
          throw new Error(salesErr?.message || 'Error al obtener ventas');
        }

        // Filtrar por rango de tiempo si aplica
        const now = new Date();
        const filteredSales = salesData.filter((s: any) => {
          if (timeFilter === 'ALL') return true;
          const saleDate = new Date(s.created_at);
          const diffDays = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24);
          if (timeFilter === '7DAYS') return diffDays <= 7;
          if (timeFilter === '30DAYS') return diffDays <= 30;
          return true;
        });

        // Agrupar por producto
        const prodMap = new Map<string, ProductProfitMetrics>();

        filteredSales.forEach((sale: any) => {
          (sale.items || []).forEach((item: any) => {
            const pId = item.product_id;
            const pName = item.product?.name || 'Producto Desconocido';
            const catName = item.product?.category?.name || 'General';
            const qty = Number(item.quantity || 0);
            const revenue = Number(item.subtotal || item.unit_price * qty || 0);
            const cost = Number(item.historical_cost_price || 0) * qty;

            if (!prodMap.has(pId)) {
              prodMap.set(pId, {
                productId: pId,
                name: pName,
                category: catName,
                unitsSold: 0,
                totalRevenue: 0,
                totalCost: 0,
                grossProfit: 0,
                marginPercentage: 0,
              });
            }

            const current = prodMap.get(pId)!;
            current.unitsSold += qty;
            current.totalRevenue += revenue;
            current.totalCost += cost;
            current.grossProfit = current.totalRevenue - current.totalCost;
            current.marginPercentage =
              current.totalRevenue > 0 ? (current.grossProfit / current.totalRevenue) * 100 : 0;
          });
        });

        if (isMounted) {
          setProductsMetrics(Array.from(prodMap.values()));
        }
      } catch (err) {
        console.error('Error al calcular rentabilidad:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfitability();
    return () => {
      isMounted = false;
    };
  }, [companyId, timeFilter]);

  // Totales globales
  const totals = useMemo(() => {
    const revenue = productsMetrics.reduce((sum, p) => sum + p.totalRevenue, 0);
    const cost = productsMetrics.reduce((sum, p) => sum + p.totalCost, 0);
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const units = productsMetrics.reduce((sum, p) => sum + p.unitsSold, 0);

    return { revenue, cost, profit, margin, units };
  }, [productsMetrics]);

  // Agrupado por categoría
  const categoryMetrics = useMemo(() => {
    const catMap = new Map<string, CategoryProfitMetrics>();

    productsMetrics.forEach((p) => {
      if (!catMap.has(p.category)) {
        catMap.set(p.category, {
          category: p.category,
          unitsSold: 0,
          totalRevenue: 0,
          totalCost: 0,
          grossProfit: 0,
          marginPercentage: 0,
        });
      }

      const c = catMap.get(p.category)!;
      c.unitsSold += p.unitsSold;
      c.totalRevenue += p.totalRevenue;
      c.totalCost += p.totalCost;
      c.grossProfit = c.totalRevenue - c.totalCost;
      c.marginPercentage = c.totalRevenue > 0 ? (c.grossProfit / c.totalRevenue) * 100 : 0;
    });

    return Array.from(catMap.values()).sort((a, b) => b.grossProfit - a.grossProfit);
  }, [productsMetrics]);

  // Ordenamientos
  const topByProfit = useMemo(() => {
    return [...productsMetrics].sort((a, b) => b.grossProfit - a.grossProfit);
  }, [productsMetrics]);

  const topByVolume = useMemo(() => {
    return [...productsMetrics].sort((a, b) => b.unitsSold - a.unitsSold);
  }, [productsMetrics]);

  if (loading) {
    return (
      <div className="p-12 text-center rounded-xl bg-white border border-slate-200 space-y-2">
        <Loader2 className="w-6 h-6 animate-spin text-slate-900 mx-auto" />
        <p className="text-xs font-semibold text-slate-700">
          Analizando ventas y costos históricos de mercadería...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans">
      {/* Selector de Rango de Fecha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Rentabilidad Comercial y Productos Estrella</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cálculo de margen bruto real basado en el Costo Promedio Ponderado (PPP) al momento de cada venta.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setTimeFilter('7DAYS')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              timeFilter === '7DAYS'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Últimos 7 días
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('30DAYS')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              timeFilter === '30DAYS'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Últimos 30 días
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('ALL')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              timeFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Histórico Total
          </button>
        </div>
      </div>

      {/* 4 Tarjetas de Métricas de Rentabilidad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Facturación Total
          </span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">
            ${totals.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {totals.units} unidades vendidas
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Costo de Mercadería (CMV)
          </span>
          <p className="text-xl font-bold font-mono text-slate-700 mt-1">
            ${totals.cost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Costo histórico de reposición
          </span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Ganancia Bruta Real
          </span>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-1">
            ${totals.profit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-800 font-semibold mt-1 block">
            Margen bruto en pesos
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Margen Promedio Comercial
          </span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">
            {totals.margin.toFixed(1)}%
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Retorno sobre facturación
          </span>
        </div>
      </div>

      {/* Selector de Pestaña de Ranking */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveRankView('PROFIT')}
              className={`h-7 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeRankView === 'PROFIT'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Mayor Ganancia Neta ($)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveRankView('VOLUME')}
              className={`h-7 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeRankView === 'VOLUME'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Más Vendidos (Unidades)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveRankView('CATEGORIES')}
              className={`h-7 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeRankView === 'CATEGORIES'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Rentabilidad por Rubro</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            {activeRankView === 'CATEGORIES'
              ? `${categoryMetrics.length} rubros evaluados`
              : `${productsMetrics.length} productos con ventas`}
          </span>
        </div>

        {/* Tabla según la vista seleccionada */}
        <div className="overflow-x-auto">
          {productsMetrics.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Aún no hay ventas registradas en el período seleccionado para calcular rentabilidad.
            </div>
          ) : activeRankView === 'CATEGORIES' ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase">
                  <th className="py-2.5 px-3">Rubro / Categoría</th>
                  <th className="py-2.5 px-3 text-center">Unidades</th>
                  <th className="py-2.5 px-3 text-right">Facturación</th>
                  <th className="py-2.5 px-3 text-right">Costo Mercadería</th>
                  <th className="py-2.5 px-3 text-right">Ganancia Bruta ($)</th>
                  <th className="py-2.5 px-3 text-right">Margen (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryMetrics.map((cat, idx) => (
                  <tr key={cat.category} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span>{cat.category}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                      {cat.unitsSold}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                      ${cat.totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      ${cat.totalCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      ${cat.grossProfit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {cat.marginPercentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase">
                  <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3">Rubro</th>
                  <th className="py-2.5 px-3 text-center">Unidades</th>
                  <th className="py-2.5 px-3 text-right">Facturación</th>
                  <th className="py-2.5 px-3 text-right">Costo (CMV)</th>
                  <th className="py-2.5 px-3 text-right">Ganancia Neta ($)</th>
                  <th className="py-2.5 px-3 text-right">Margen (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(activeRankView === 'PROFIT' ? topByProfit : topByVolume).map((p, idx) => (
                  <tr key={p.productId} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`w-5 h-5 mx-auto rounded-full font-mono text-[10px] flex items-center justify-center font-bold ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-50 text-amber-800'
                            : 'text-slate-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">{p.category}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                      {p.unitsSold}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                      ${p.totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      ${p.totalCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      ${p.grossProfit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {p.marginPercentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
