import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, AlertTriangle, ArrowRight, ShoppingCart, ShieldAlert } from 'lucide-react';
import { InventoryExportRow } from '@/core/domain/alerts/types';

interface RestockSuggestionsCardProps {
  products: InventoryExportRow[];
}

export function RestockSuggestionsCard({ products }: RestockSuggestionsCardProps) {
  // Filtrar productos con quiebre o stock bajo
  const criticalItems = products
    .filter((p) => p.status === 'QUIEBRE' || p.status === 'BAJO_STOCK')
    .map((item) => {
      const minStock = Math.max(item.minStockAlert, 5); // Por defecto si no tiene umbral asumimos mínimo 5
      const available = Math.max(item.availableStock, 0);
      // Sugerencia: reponer hasta cubrir el mínimo + un ciclo de reposición
      const suggestedQty = item.status === 'QUIEBRE' ? minStock * 2 : Math.max(minStock - available + 5, 5);
      const estimatedCost = suggestedQty * (item.costPrice || 0);

      return {
        ...item,
        minTarget: minStock,
        suggestedQty,
        estimatedCost,
      };
    });

  if (criticalItems.length === 0) return null;

  const totalInvestment = criticalItems.reduce((acc, it) => acc + it.estimatedCost, 0);
  const totalUnitsToBuy = criticalItems.reduce((acc, it) => acc + it.suggestedQty, 0);

  return (
    <div className="rounded-xl border border-amber-200/90 bg-amber-50/40 p-4 sm:p-5 space-y-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-amber-800" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Sugerencia Inteligente de Reabastecimiento
              </h3>
              <span className="text-[10px] font-bold uppercase bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded border border-amber-300">
                {criticalItems.length} {criticalItems.length === 1 ? 'artículo crítico' : 'artículos críticos'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Cálculo automatizado basado en puntos de reorden y costos promedio ponderados
            </p>
          </div>
        </div>

        <Link
          to="/compras"
          className="h-8 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Generar Orden de Compra</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
        </Link>
      </div>

      {/* Tabla resumen de sugerencias de compra */}
      <div className="rounded-lg bg-white border border-amber-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-amber-100/40 border-b border-amber-200/80 text-slate-700 font-bold text-[11px] uppercase">
              <tr>
                <th scope="col" className="py-2.5 px-3">Artículo & SKU</th>
                <th scope="col" className="py-2.5 px-3 text-center">Disponible</th>
                <th scope="col" className="py-2.5 px-3 text-center">Umbral Mínimo</th>
                <th scope="col" className="py-2.5 px-3 text-center">Pedido Sugerido</th>
                <th scope="col" className="py-2.5 px-3 text-right">Costo Unit. (PPP)</th>
                <th scope="col" className="py-2.5 px-3 text-right">Inversión Estimada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {criticalItems.map((item) => {
                const isZero = item.availableStock <= 0;
                return (
                  <tr key={item.sku} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        {isZero ? (
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{item.productName}</p>
                          <p className="text-[10px] font-mono text-slate-500">SKU: {item.sku}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-2 px-3 text-center">
                      <span
                        className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                          isZero
                            ? 'bg-rose-100 text-rose-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {item.availableStock} un.
                      </span>
                    </td>

                    <td className="py-2 px-3 text-center font-mono text-slate-600">
                      {item.minStockAlert} un.
                    </td>

                    <td className="py-2 px-3 text-center">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        +{item.suggestedQty} un.
                      </span>
                    </td>

                    <td className="py-2 px-3 text-right font-mono text-slate-600 tabular-nums">
                      ${item.costPrice?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      ${Math.round(item.estimatedCost).toLocaleString('es-AR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totalizador del pedido sugerido */}
        <div className="p-3 bg-amber-50/60 border-t border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
          <span className="text-slate-600">
            Total de unidades sugeridas para reponer el depósito central:{' '}
            <strong className="text-slate-900 font-bold">{totalUnitsToBuy} un.</strong>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Presupuesto estimado total de reposición:</span>
            <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
              ${Math.round(totalInvestment).toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
