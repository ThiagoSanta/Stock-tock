'use client';

import React from 'react';
import { SaleWithDetails } from '@/core/application/ports/ISaleRepository';
import { Receipt, TrendingUp, Eye } from 'lucide-react';

interface SalesTableProps {
  sales: SaleWithDetails[];
  loading: boolean;
  onSelectSale: (sale: SaleWithDetails) => void;
}

export function SalesTable({ sales, loading, onSelectSale }: SalesTableProps) {
  if (loading) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226]">
        <div className="w-6 h-6 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-zinc-400">Cargando historial de ventas...</p>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226] space-y-2">
        <Receipt className="w-8 h-8 text-zinc-600 mx-auto" />
        <h4 className="text-sm font-semibold text-zinc-300">No hay ventas registradas</h4>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          Las ventas realizadas desde el Mostrador POS o por despacho de pedidos se listarán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#121214] border border-[#222226] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#161619] border-b border-[#222226] text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-3 px-4">Comprobante #</th>
              <th className="py-3 px-4">Fecha & Hora</th>
              <th className="py-3 px-4">Cliente / Destino</th>
              <th className="py-3 px-4 text-center">Canal Origen</th>
              <th className="py-3 px-4 text-center">Medio de Cobro</th>
              <th className="py-3 px-4 text-right">Total Facturado</th>
              <th className="py-3 px-4 text-right">Margen Bruto Est.</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1c1c20]">
            {sales.map((sale) => {
              const isPos = sale.origin === 'VENTA_DIRECTA_MOSTRADOR';

              return (
                <tr
                  key={sale.id}
                  onClick={() => onSelectSale(sale)}
                  className="hover:bg-[#16161a] transition-colors cursor-pointer"
                >
                  {/* Comprobante */}
                  <td className="py-3.5 px-4 font-mono font-semibold text-zinc-200">
                    {sale.saleNumber}
                  </td>

                  {/* Fecha */}
                  <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">
                    {new Date(sale.createdAt).toLocaleString('es-AR')}
                  </td>

                  {/* Cliente */}
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-zinc-100">{sale.customerName}</span>
                  </td>

                  {/* Origen */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isPos
                          ? 'bg-[#84cc16]/10 text-[#84cc16] border-[#84cc16]/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}
                    >
                      {isPos ? 'Mostrador POS' : 'Despacho Pedido'}
                    </span>
                  </td>

                  {/* Medio de Pago */}
                  <td className="py-3.5 px-4 text-center font-mono text-zinc-400 text-[11px]">
                    {sale.paymentMethod}
                  </td>

                  {/* Total */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-100 text-sm">
                    ${sale.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Margen */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <span className="text-[#84cc16] font-semibold block">
                      ${sale.estimatedGrossMargin.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      ({sale.marginPercentage}%)
                    </span>
                  </td>

                  {/* Botón Ver */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelectSale(sale)}
                      className="p-1.5 rounded-lg bg-[#1f2024] hover:bg-[#28282e] text-zinc-300 hover:text-zinc-100 transition-colors"
                      title="Ver Comprobante"
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
