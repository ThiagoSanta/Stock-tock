import React from 'react';
import { CustomerWithMetrics } from '@/core/domain/contacts/types';
import { Users, Mail, Phone, MapPin, ShoppingCart, CheckCircle2, XCircle, DollarSign, FileSpreadsheet } from 'lucide-react';

interface CustomerTableProps {
  customers: CustomerWithMetrics[];
  loading: boolean;
  onToggleStatus: (id: string, newStatus: boolean) => void;
  onOpenPayment?: (customer: CustomerWithMetrics) => void;
  onOpenStatement?: (customer: CustomerWithMetrics) => void;
}

export function CustomerTable({ customers, loading, onToggleStatus, onOpenPayment, onOpenStatement }: CustomerTableProps) {
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
        <p className="text-xs font-semibold text-slate-700">Cargando directorio de clientes...</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
        <Users className="w-6 h-6 text-slate-400 mx-auto mb-2" aria-hidden="true" />
        <h4 className="text-xs font-bold text-slate-900">No se encontraron clientes</h4>
        <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
          Registrá tus clientes para vincular sus ventas y pedidos comerciales.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Directorio de clientes y su historial de compras</caption>
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th scope="col" className="py-3 px-3">Cliente / Razón Social</th>
              <th scope="col" className="py-3 px-3">Identificación Fiscal</th>
              <th scope="col" className="py-3 px-3">Contacto Directo</th>
              <th scope="col" className="py-3 px-3">Dirección</th>
              <th scope="col" className="py-3 px-3 text-center">Compras</th>
              <th scope="col" className="py-3 px-3 text-right">Total Facturado</th>
              <th scope="col" className="py-3 px-3 text-right">Saldo Cta. Cte.</th>
              <th scope="col" className="py-3 px-3 text-center">Estado</th>
              <th scope="col" className="py-3 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-slate-900">{c.name}</div>
                  {c.notes && (
                    <div className="text-xs text-slate-500 truncate max-w-xs">{c.notes}</div>
                  )}
                </td>
                <td className="py-2.5 px-3 text-slate-700 font-mono text-xs">
                  {c.taxId || <span className="text-slate-500 italic">Consumidor Final</span>}
                </td>
                <td className="py-2.5 px-3 text-slate-700">
                  <div className="space-y-0.5">
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                        <span className="font-medium">{c.email}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                        <span className="font-medium">{c.phone}</span>
                      </div>
                    )}
                    {!c.email && !c.phone && <span className="text-slate-400">-</span>}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate">
                  {c.address ? (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      <span className="truncate font-medium">{c.address}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs font-semibold">
                    <ShoppingCart className="w-3 h-3 text-slate-600" aria-hidden="true" />
                    {c.totalOrdersCount}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                  ${c.totalSpent.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                  {typeof c.currentBalance === 'number' && c.currentBalance > 0 ? (
                    <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      ${c.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">$0,00</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                      c.active
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {c.active ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" aria-hidden="true" /> Inactivo
                      </>
                    )}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {onOpenStatement && (
                      <button
                        type="button"
                        onClick={() => onOpenStatement(c)}
                        title="Ver e imprimir estado de cuenta corriente A4"
                        className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <FileSpreadsheet className="w-3 h-3 text-slate-600" />
                        <span>Cta. Cte.</span>
                      </button>
                    )}
                    {onOpenPayment && (
                      <button
                        type="button"
                        onClick={() => onOpenPayment(c)}
                        title="Registrar cobranza y emitir recibo A4"
                        className="px-2 py-1 text-xs font-semibold rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Cobrar</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onToggleStatus(c.id, !c.active)}
                      aria-label={`${c.active ? 'Desactivar' : 'Reactivar'} cliente ${c.name}`}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900"
                    >
                      {c.active ? 'Desactivar' : 'Reactivar'}
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
