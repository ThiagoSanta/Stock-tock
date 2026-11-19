import React from 'react';
import { SaleWithDetails } from '@/core/application/ports/ISaleRepository';
import { Receipt, Eye } from 'lucide-react';

interface SalesTableProps {
  sales: SaleWithDetails[];
  loading: boolean;
  onSelectSale: (sale: SaleWithDetails) => void;
}

export function SalesTable({ sales, loading, onSelectSale }: SalesTableProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs"
      >
        <div
          aria-hidden="true"
          className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"
        />
        <p className="text-xs font-semibold text-slate-700">Cargando registros de ventas...</p>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
        <Receipt className="w-6 h-6 text-slate-400 mx-auto mb-2" aria-hidden="true" />
        <h4 className="text-xs font-bold text-slate-900">No hay ventas registradas</h4>
        <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
          Las ventas realizadas desde el Mostrador POS o por despacho de pedidos se listarán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Historial de ventas comerciales con totales y márgenes brutos</caption>
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th scope="col" className="py-3 px-3">Comprobante #</th>
              <th scope="col" className="py-3 px-3">Fecha & Hora</th>
              <th scope="col" className="py-3 px-3">Cliente / Destino</th>
              <th scope="col" className="py-3 px-3 text-center">Canal Origen</th>
              <th scope="col" className="py-3 px-3 text-center">Medio de Cobro</th>
              <th scope="col" className="py-3 px-3 text-right">Total Facturado</th>
              <th scope="col" className="py-3 px-3 text-right">Margen Bruto Est.</th>
              <th scope="col" className="py-3 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sales.map((sale) => {
              const isPos = sale.origin === 'VENTA_DIRECTA_MOSTRADOR';

              return (
                <tr
                  key={sale.id}
                  onClick={() => onSelectSale(sale)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 tabular-nums">
                    {sale.saleNumber}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs text-slate-600 tabular-nums">
                    {new Date(sale.createdAt).toLocaleString('es-AR')}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {sale.customerName}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                        isPos
                          ? 'bg-slate-100 text-slate-800 border-slate-300'
                          : 'bg-blue-50 text-blue-900 border-blue-300'
                      }`}
                    >
                      {isPos ? 'Mostrador POS' : 'Despacho'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-700 font-medium">
                    {sale.paymentMethod}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                    ${sale.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 tabular-nums">
                    +${sale.estimatedGrossMargin.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      aria-label={`Ver detalle del comprobante ${sale.saleNumber}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSale(sale);
                      }}
                      className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900"
                    >
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    </button>
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
