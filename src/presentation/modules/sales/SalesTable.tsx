import React from 'react';
import { SaleWithDetails } from '@/core/application/ports/ISaleRepository';
import { Receipt, Eye, Undo2 } from 'lucide-react';

interface SalesTableProps {
  sales: SaleWithDetails[];
  loading: boolean;
  onSelectSale: (sale: SaleWithDetails) => void;
  onOpenReturn?: (sale: SaleWithDetails) => void;
}

export function SalesTable({ sales, loading, onSelectSale, onOpenReturn }: SalesTableProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="p-8 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs"
      >
        <div
          aria-hidden="true"
          className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"
        />
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Cargando registros de ventas...</p>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-xs">
        <Receipt className="w-6 h-6 text-zinc-400 dark:text-zinc-500 mx-auto mb-2" aria-hidden="true" />
        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">No hay ventas registradas</h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto font-medium">
          Las ventas realizadas desde el Mostrador POS o por despacho de pedidos se listarán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Historial de ventas comerciales con totales y márgenes brutos</caption>
          <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px] font-bold">
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
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {sales.map((sale) => {
              const isPos = sale.origin === 'VENTA_DIRECTA_MOSTRADOR';

              return (
                <tr
                  key={sale.id}
                  onClick={() => onSelectSale(sale)}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {sale.saleNumber}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">
                    {new Date(sale.createdAt).toLocaleString('es-AR')}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                    {sale.customerName}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                        isPos
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                          : 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/70'
                      }`}
                    >
                      {isPos ? 'Mostrador POS' : 'Despacho'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                    {sale.paymentMethod}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    ${sale.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">
                    +${sale.estimatedGrossMargin.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onOpenReturn && (
                        <button
                          type="button"
                          aria-label={`Devolución / cambio de la venta ${sale.saleNumber}`}
                          title="Devolución / Cambio de mercadería"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReturn(sale);
                          }}
                          className="p-1.5 rounded text-zinc-400 dark:text-zinc-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={`Ver comprobante A4 de la venta ${sale.saleNumber}`}
                        title="Ver e imprimir comprobante A4"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSale(sale);
                        }}
                        className="p-1.5 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-zinc-900"
                      >
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
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
