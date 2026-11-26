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
        className="p-8 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs"
      >
        <div
          aria-hidden="true"
          className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"
        />
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Cargando pedidos de clientes...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-xs">
        <FileText className="w-6 h-6 text-zinc-400 dark:text-zinc-500 mx-auto mb-2" aria-hidden="true" />
        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">No hay pedidos registrados</h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto font-medium">
          Creá un nuevo pedido de cliente para comprometer y reservar mercadería.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'BORRADOR':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700">
            <Clock className="w-3 h-3" aria-hidden="true" /> Borrador
          </span>
        );
      case 'PRESUPUESTO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/70">
            <FileText className="w-3 h-3" aria-hidden="true" /> Presupuesto
          </span>
        );
      case 'CONFIRMADO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/70">
            <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Reserva Activa
          </span>
        );
      case 'DESPACHADO_TOTAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70">
            <Truck className="w-3 h-3" aria-hidden="true" /> Despachado
          </span>
        );
      case 'CANCELADO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/70">
            <XCircle className="w-3 h-3" aria-hidden="true" /> Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Listado de pedidos comerciales y su estado de despacho</caption>
          <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px] font-bold">
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
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                <td className="py-2.5 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {order.orderNumber}
                </td>
                <td className="py-2.5 px-3 font-mono text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">
                  {new Date(order.createdAt).toLocaleDateString('es-AR')}
                </td>
                <td className="py-2.5 px-3 text-zinc-900 dark:text-zinc-100 font-semibold">
                  {order.customerName}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-zinc-700 dark:text-zinc-300 tabular-nums font-medium">
                  {order.items.length} prod.
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
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
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 hover:bg-sky-100 border border-sky-200 dark:border-sky-800/70 transition-colors cursor-pointer"
                      >
                        Aprobar Pedido
                      </button>
                    )}
                    {order.status === 'BORRADOR' && (
                      <button
                        type="button"
                        onClick={() => onConfirmOrder(order.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 hover:bg-sky-100 border border-sky-200 dark:border-sky-800/70 transition-colors cursor-pointer"
                      >
                        Confirmar
                      </button>
                    )}
                    {order.status === 'CONFIRMADO' && (
                      <button
                        type="button"
                        onClick={() => onDispatchOrder(order.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/70 transition-colors cursor-pointer"
                      >
                        Despachar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectOrder(order)}
                      aria-label={`Ver detalle del pedido ${order.orderNumber}`}
                      className="p-1 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-zinc-900"
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
