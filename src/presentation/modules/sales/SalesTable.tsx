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
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs">
        <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Cargando ventas...</p>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
        <Receipt className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <h4 className="text-xs font-semibold text-slate-900">No hay ventas registradas</h4>
        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
          Las ventas realizadas desde el Mostrador POS o por despacho de pedidos se listarán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-2.5 px-3">Comprobante #</th>
              <th className="py-2.5 px-3">Fecha & Hora</th>
              <th className="py-2.5 px-3">Cliente / Destino</th>
              <th className="py-2.5 px-3 text-center">Canal Origen</th>
              <th className="py-2.5 px-3 text-center">Medio de Cobro</th>
              <th className="py-2.5 px-3 text-right">Total Facturado</th>
              <th className="py-2.5 px-3 text-right">Margen Bruto Est.</th>
              <th className="py-2.5 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sales.map((sale) => {
              const isPos = sale.origin === 'VENTA_DIRECTA_MOSTRADOR';

              return (
                <tr
                  key={sale.id}
                  onClick={() => onSelectSale(sale)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                    {sale.saleNumber}
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                    {new Date(sale.createdAt).toLocaleString('es-AR')}
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-800">
                    {sale.customerName}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                        isPos
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {isPos ? 'Mostrador POS' : 'Despacho'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-600">
                    {sale.paymentMethod}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    ${sale.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-medium text-emerald-700">
                    +${sale.estimatedGrossMargin.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSale(sale);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
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
