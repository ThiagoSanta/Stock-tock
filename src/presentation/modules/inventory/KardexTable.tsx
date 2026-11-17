'use client';

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
      <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226]">
        <div className="w-6 h-6 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-zinc-400">Cargando movimientos del Kardex...</p>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226] space-y-2">
        <History className="w-8 h-8 text-zinc-600 mx-auto" />
        <h4 className="text-sm font-semibold text-zinc-300">No hay movimientos en el Kardex</h4>
        <p className="text-xs text-zinc-500">Todas las entradas, salidas y reservas quedarán registradas aquí.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#121214] border border-[#222226] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#161619] border-b border-[#222226] text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-3 px-4">Fecha & Hora</th>
              <th className="py-3 px-4">Tipo Movimiento</th>
              <th className="py-3 px-4">Producto</th>
              <th className="py-3 px-4 text-center">Variación</th>
              <th className="py-3 px-4 text-center">Saldo Físico</th>
              <th className="py-3 px-4 text-center">Saldo Disponible</th>
              <th className="py-3 px-4">Motivo / Referencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1c1c20]">
            {movements.map((m) => {
              const isNegative = m.quantity < 0;
              const isReservation = m.movementType.includes('RESERVA');

              return (
                <tr key={m.id} className="hover:bg-[#16161a] transition-colors">
                  <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">
                    {new Date(m.createdAt).toLocaleString('es-AR')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                        isReservation
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : isNegative
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-[#84cc16]/10 text-[#84cc16] border-[#84cc16]/20'
                      }`}
                    >
                      {m.movementType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-zinc-100 block">{m.productName}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{m.sku}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-xs">
                    <span className={isNegative ? 'text-rose-400' : 'text-[#84cc16]'}>
                      {isNegative ? '' : '+'}{m.quantity} un.
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-zinc-300">
                    {m.balancePhysicalAfter} un.
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-[#84cc16]">
                    {m.balanceAvailableAfter} un.
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 max-w-xs truncate">
                    {m.notes || m.referenceType || '—'}
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
