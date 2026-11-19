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
        className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs"
      >
        <div
          aria-hidden="true"
          className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"
        />
        <p className="text-xs font-semibold text-slate-700">Cargando Kardex de movimientos...</p>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
        <History className="w-6 h-6 text-slate-400 mx-auto mb-2" aria-hidden="true" />
        <h4 className="text-xs font-bold text-slate-900">No hay movimientos en el Kardex</h4>
        <p className="text-xs text-slate-600 font-medium">
          Todas las entradas, salidas y reservas quedarán registradas aquí con trazabilidad completa.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Historial cronológico de movimientos del Kardex con saldos resultantes</caption>
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-bold">
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
          <tbody className="divide-y divide-slate-100">
            {movements.map((m) => {
              const isNegative = m.quantity < 0;
              const isReservation = m.movementType.includes('RESERVA');

              return (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-600 text-xs tabular-nums">
                    {new Date(m.createdAt).toLocaleString('es-AR')}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                        isReservation
                          ? 'bg-blue-50 text-blue-900 border-blue-300'
                          : isNegative
                          ? 'bg-rose-50 text-rose-900 border-rose-300'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      {m.movementType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-900 block">{m.productName}</span>
                    <span className="font-mono text-xs text-slate-600">
                      SKU: {m.sku} • {m.warehouseName}
                    </span>
                  </td>
                  <td
                    className={`py-2.5 px-3 text-center font-mono font-bold tabular-nums text-xs ${
                      isNegative ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {isNegative ? '' : '+'}{m.quantity} un.
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800 tabular-nums">
                    {m.balancePhysicalAfter}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 tabular-nums">
                    {m.balanceAvailableAfter}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 text-xs max-w-xs truncate font-medium">
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
