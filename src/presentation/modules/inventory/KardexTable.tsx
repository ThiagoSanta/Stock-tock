import React from 'react';
import { StockMovementDetailed } from '@/core/application/ports/IInventoryRepository';
import { History } from 'lucide-react';

interface KardexTableProps {
  movements: StockMovementDetailed[];
  loading: boolean;
}

export function KardexTable({ movements, loading }: KardexTableProps) {
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
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Cargando Kardex de movimientos...</p>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-xs">
        <History className="w-6 h-6 text-zinc-400 dark:text-zinc-500 mx-auto mb-2" aria-hidden="true" />
        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">No hay movimientos en el Kardex</h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
          Todas las entradas, salidas y reservas quedarán registradas aquí con trazabilidad completa.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Historial cronológico de movimientos del Kardex con saldos resultantes</caption>
          <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th scope="col" className="py-3 px-3">Fecha & Hora</th>
              <th scope="col" className="py-3 px-3">Tipo Movimiento</th>
              <th scope="col" className="py-3 px-3">Producto</th>
              <th scope="col" className="py-3 px-3 text-center">Variación</th>
              <th scope="col" className="py-3 px-3 text-center">Saldo Físico</th>
              <th scope="col" className="py-3 px-3 text-center">Saldo Disponible</th>
              <th scope="col" className="py-3 px-3">Motivo / Auditoría</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {movements.map((m) => {
              const isNegative = m.quantity < 0;
              const isReservation = m.movementType.includes('RESERVA');

              return (
                <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-zinc-600 dark:text-zinc-400 text-xs tabular-nums">
                    {new Date(m.createdAt).toLocaleString('es-AR')}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                        isReservation
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/70'
                          : isNegative
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/70'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70'
                      }`}
                    >
                      {m.movementType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">{m.productName}</span>
                    <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      SKU: {m.sku} • {m.warehouseName}
                    </span>
                  </td>
                  <td
                    className={`py-2.5 px-3 text-center font-mono font-bold tabular-nums text-xs ${
                      isNegative ? 'text-rose-800 dark:text-rose-300' : 'text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    {isNegative ? '' : '+'}{m.quantity} un.
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                    {m.balancePhysicalAfter}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {m.balanceAvailableAfter}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300 text-xs max-w-xs truncate font-medium">
                    {m.notes || m.referenceType || '-'}
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
