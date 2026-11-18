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
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs">
        <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Cargando pedidos...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
        <FileText className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <h4 className="text-xs font-semibold text-slate-900">No hay pedidos registrados</h4>
        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
          Creá un nuevo pedido de cliente para comprometer y reservar mercadería.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'BORRADOR':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200">
            <Clock className="w-2.5 h-2.5" /> Borrador
          </span>
        );
      case 'CONFIRMADO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
            <CheckCircle2 className="w-2.5 h-2.5" /> Reserva Activa
          </span>
        );
      case 'DESPACHADO_TOTAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
            <Truck className="w-2.5 h-2.5" /> Despachado
          </span>
        );
      case 'CANCELADO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">
            <XCircle className="w-2.5 h-2.5" /> Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-lg bg-white border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-2.5 px-3">Pedido #</th>
              <th className="py-2.5 px-3">Fecha</th>
              <th className="py-2.5 px-3">Cliente</th>
              <th className="py-2.5 px-3 text-center">Ítems</th>
              <th className="py-2.5 px-3 text-right">Total ($)</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
              <th className="py-2.5 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                  {order.orderNumber}
                </td>
                <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString('es-AR')}
                </td>
                <td className="py-2 px-3 text-slate-800 font-medium">
                  {order.customerName}
                </td>
                <td className="py-2 px-3 text-center font-mono text-slate-600">
                  {order.items.length} prod.
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                  ${order.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 text-center">
                  {getStatusBadge(order.status)}
                </td>
                <td className="py-2 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {order.status === 'BORRADOR' && (
                      <button
                        onClick={() => onConfirmOrder(order.id)}
                        className="px-2 py-0.5 text-[11px] font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                      >
                        Confirmar
                      </button>
                    )}
                    {order.status === 'CONFIRMADO' && (
                      <button
                        onClick={() => onDispatchOrder(order.id)}
                        className="px-2 py-0.5 text-[11px] font-medium rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                      >
                        Despachar
                      </button>
                    )}
                    <button
                      onClick={() => onSelectOrder(order)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Ver Detalle"
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
