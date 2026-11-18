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
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs">
        <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Cargando Kardex...</p>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
        <History className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <h4 className="text-xs font-semibold text-slate-900">No hay movimientos en el Kardex</h4>
        <p className="text-[11px] text-slate-500">Todas las entradas, salidas y reservas quedarán registradas aquí.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-2.5 px-3">Fecha & Hora</th>
              <th className="py-2.5 px-3">Tipo Movimiento</th>
              <th className="py-2.5 px-3">Producto</th>
              <th className="py-2.5 px-3 text-center">Variación</th>
              <th className="py-2.5 px-3 text-center">Saldo Físico</th>
              <th className="py-2.5 px-3 text-center">Saldo Disponible</th>
              <th className="py-2.5 px-3">Motivo / Auditoría</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movements.map((m) => {
              const isNegative = m.quantity < 0;
              const isReservation = m.movementType.includes('RESERVA');

              return (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">
                    {new Date(m.createdAt).toLocaleString('es-AR')}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border ${
                        isReservation
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : isNegative
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {m.movementType}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="font-medium text-slate-900 block">{m.productName}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      SKU: {m.sku} • {m.warehouseName}
                    </span>
                  </td>
                  <td
                    className={`py-2 px-3 text-center font-mono font-bold ${
                      isNegative ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {isNegative ? '' : '+'}{m.quantity} un.
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-700">
                    {m.balancePhysicalAfter}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-semibold text-slate-900">
                    {m.balanceAvailableAfter}
                  </td>
                  <td className="py-2 px-3 text-slate-500 text-[11px] max-w-xs truncate">
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
