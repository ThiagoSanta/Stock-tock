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
      <div
        role="status"
        aria-live="polite"
        className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs"
      >
        <div
          aria-hidden="true"
          className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"
        />
        <p className="text-xs font-semibold text-slate-700">Cargando pedidos de clientes...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
        <FileText className="w-6 h-6 text-slate-400 mx-auto mb-2" aria-hidden="true" />
        <h4 className="text-xs font-bold text-slate-900">No hay pedidos registrados</h4>
        <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
          Creá un nuevo pedido de cliente para comprometer y reservar mercadería.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'BORRADOR':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-slate-100 text-slate-800 border-slate-300">
            <Clock className="w-3 h-3" aria-hidden="true" /> Borrador
          </span>
        );
      case 'PRESUPUESTO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-purple-50 text-purple-900 border-purple-300">
            <FileText className="w-3 h-3" aria-hidden="true" /> Presupuesto
          </span>
        );
      case 'CONFIRMADO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-blue-50 text-blue-900 border-blue-300">
            <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Reserva Activa
          </span>
        );
      case 'DESPACHADO_TOTAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-900 border-emerald-300">
            <Truck className="w-3 h-3" aria-hidden="true" /> Despachado
          </span>
        );
      case 'CANCELADO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-rose-50 text-rose-900 border-rose-300">
            <XCircle className="w-3 h-3" aria-hidden="true" /> Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-slate-100 text-slate-800 border-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-lg bg-white border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Listado de pedidos comerciales y su estado de despacho</caption>
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th scope="col" className="py-3 px-3">Pedido #</th>
              <th scope="col" className="py-3 px-3">Fecha</th>
              <th scope="col" className="py-3 px-3">Cliente</th>
              <th scope="col" className="py-3 px-3 text-center">Ítems</th>
              <th scope="col" className="py-3 px-3 text-right">Total ($)</th>
              <th scope="col" className="py-3 px-3 text-center">Estado</th>
              <th scope="col" className="py-3 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-3 font-mono font-bold text-slate-900 tabular-nums">
                  {order.orderNumber}
                </td>
                <td className="py-2.5 px-3 font-mono text-xs text-slate-600 tabular-nums">
                  {new Date(order.createdAt).toLocaleDateString('es-AR')}
                </td>
                <td className="py-2.5 px-3 text-slate-900 font-semibold">
                  {order.customerName}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-slate-700 tabular-nums font-medium">
                  {order.items.length} prod.
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                  ${order.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {getStatusBadge(order.status)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {order.status === 'PRESUPUESTO' && (
                      <button
                        type="button"
                        onClick={() => onConfirmOrder(order.id)}
                        title="Aprobar presupuesto y comprometer mercadería en depósito"
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-300 transition-colors cursor-pointer"
                      >
                        Aprobar Pedido
                      </button>
                    )}
                    {order.status === 'BORRADOR' && (
                      <button
                        type="button"
                        onClick={() => onConfirmOrder(order.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-300 transition-colors cursor-pointer"
                      >
                        Confirmar
                      </button>
                    )}
                    {order.status === 'CONFIRMADO' && (
                      <button
                        type="button"
                        onClick={() => onDispatchOrder(order.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer"
                      >
                        Despachar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectOrder(order)}
                      aria-label={`Ver detalle del pedido ${order.orderNumber}`}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900"
                    >
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
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
