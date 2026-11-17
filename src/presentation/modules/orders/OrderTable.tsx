'use client';

import React from 'react';
import { Order, OrderStatus } from '@/core/domain/orders/types';
import { Clock, CheckCircle2, Truck, XCircle, FileText, ChevronRight } from 'lucide-react';

interface OrderTableProps {
  orders: Order[];
  loading: boolean;
  onSelectOrder: (order: Order) => void;
  onConfirmOrder: (orderId: string) => void;
  onDispatchOrder: (orderId: string) => void;
}

export function OrderTable({
  orders,
  loading,
  onSelectOrder,
  onConfirmOrder,
  onDispatchOrder,
}: OrderTableProps) {
  if (loading) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226]">
        <div className="w-6 h-6 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-zinc-400">Cargando pedidos...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226] space-y-2">
        <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
        <h4 className="text-sm font-semibold text-zinc-300">No hay pedidos registrados</h4>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          Creá un nuevo pedido de cliente para comprometer y reservar mercadería.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'BORRADOR':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <Clock className="w-3 h-3" />
            <span>Borrador</span>
          </span>
        );
      case 'CONFIRMADO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Reserva Activa</span>
          </span>
        );
      case 'EN_PREPARACION':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            <span>En Preparación</span>
          </span>
        );
      case 'DESPACHADO_TOTAL':
      case 'CERRADO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#84cc16]/10 text-[#84cc16] border border-[#84cc16]/20">
            <Truck className="w-3 h-3" />
            <span>Despachado</span>
          </span>
        );
      case 'CANCELADO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            <span>Cancelado</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl bg-[#121214] border border-[#222226] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#161619] border-b border-[#222226] text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-3 px-4">Pedido #</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Ítems Solicitados</th>
              <th className="py-3 px-4 text-right">Importe Total</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1c1c20]">
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className="hover:bg-[#16161a] transition-colors cursor-pointer"
              >
                {/* Número y Fecha */}
                <td className="py-3.5 px-4 font-mono font-semibold text-zinc-200">
                  {order.orderNumber}
                  <span className="block text-[10px] font-sans text-zinc-500 font-normal">
                    {new Date(order.createdAt).toLocaleDateString('es-AR')}
                  </span>
                </td>

                {/* Cliente */}
                <td className="py-3.5 px-4">
                  <span className="font-medium text-zinc-100">{order.customerName}</span>
                </td>

                {/* Ítems */}
                <td className="py-3.5 px-4 text-zinc-400">
                  {order.items.length} producto{order.items.length !== 1 ? 's' : ''} (
                  {order.items.reduce((s, it) => s + it.quantityRequested, 0)} un.)
                </td>

                {/* Total */}
                <td className="py-3.5 px-4 text-right font-mono font-semibold text-zinc-100">
                  ${order.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>

                {/* Estado */}
                <td className="py-3.5 px-4 text-center">
                  {getStatusBadge(order.status)}
                </td>

                {/* Acciones */}
                <td
                  className="py-3.5 px-4 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    {order.status === 'BORRADOR' && (
                      <button
                        onClick={() => onConfirmOrder(order.id)}
                        className="px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold text-[11px] transition-colors"
                      >
                        Confirmar
                      </button>
                    )}
                    {order.status === 'CONFIRMADO' && (
                      <button
                        onClick={() => onDispatchOrder(order.id)}
                        className="px-2.5 py-1 rounded bg-[#84cc16]/10 hover:bg-[#84cc16]/20 text-[#84cc16] border border-[#84cc16]/30 font-semibold text-[11px] transition-colors"
                      >
                        Despachar
                      </button>
                    )}
                    <button
                      onClick={() => onSelectOrder(order)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-[#202026]"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
