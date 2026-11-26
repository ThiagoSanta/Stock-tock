import React from 'react';
import { CustomerWithMetrics } from '@/core/domain/contacts/types';
import { Users, Mail, Phone, MapPin, ShoppingCart, CheckCircle2, XCircle, DollarSign, FileSpreadsheet, User } from 'lucide-react';

interface CustomerTableProps {
  customers: CustomerWithMetrics[];
  loading: boolean;
  onToggleStatus: (id: string, newStatus: boolean) => void;
  onOpenPayment?: (customer: CustomerWithMetrics) => void;
  onOpenStatement?: (customer: CustomerWithMetrics) => void;
  onOpenProfile?: (customer: CustomerWithMetrics) => void;
}

export function CustomerTable({
  customers,
  loading,
  onToggleStatus,
  onOpenPayment,
  onOpenStatement,
  onOpenProfile,
}: CustomerTableProps) {
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
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Cargando directorio de clientes...</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-xs">
        <Users className="w-6 h-6 text-zinc-400 dark:text-zinc-500 mx-auto mb-2" aria-hidden="true" />
        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">No se encontraron clientes</h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto font-medium">
          Registrá tus clientes para vincular sus ventas y pedidos comerciales.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Directorio de clientes y su historial de compras</caption>
          <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th scope="col" className="py-3 px-3">Cliente / Razón Social</th>
              <th scope="col" className="py-3 px-3">Lista & Límite</th>
              <th scope="col" className="py-3 px-3">Identificación Fiscal</th>
              <th scope="col" className="py-3 px-3">Contacto Directo</th>
              <th scope="col" className="py-3 px-3 text-center">Compras</th>
              <th scope="col" className="py-3 px-3 text-right">Total Facturado</th>
              <th scope="col" className="py-3 px-3 text-right">Saldo Cta. Cte.</th>
              <th scope="col" className="py-3 px-3 text-center">Estado</th>
              <th scope="col" className="py-3 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{c.name}</div>
                  {c.notes && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-xs">{c.notes}</div>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    c.priceList === 'MAYORISTA'
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/70'
                      : c.priceList === 'GREMIO'
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/70'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                  }`}>
                    {c.priceList || 'MINORISTA'}
                  </span>
                  {c.creditLimit && c.creditLimit > 0 ? (
                    <span className="block text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Lím: ${c.creditLimit.toLocaleString('es-AR')}
                    </span>
                  ) : null}
                </td>
                <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                  {c.taxId || <span className="text-zinc-500 dark:text-zinc-400 italic">Consumidor Final</span>}
                </td>
                <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300">
                  <div className="space-y-0.5">
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                        <Mail className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" aria-hidden="true" />
                        <span className="font-medium">{c.email}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                        <Phone className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" aria-hidden="true" />
                        <span className="font-medium">{c.phone}</span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" aria-hidden="true" />
                        <span className="truncate max-w-[160px]">{c.address}</span>
                      </div>
                    )}
                    {!c.email && !c.phone && !c.address && <span className="text-zinc-400 dark:text-zinc-500">-</span>}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-xs font-semibold">
                    <ShoppingCart className="w-3 h-3 text-zinc-600 dark:text-zinc-400" aria-hidden="true" />
                    {c.totalOrdersCount}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  ${c.totalSpent.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                  {typeof c.currentBalance === 'number' && c.currentBalance > 0 ? (
                    <span className="font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800/70">
                      ${c.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500 font-medium">$0,00</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                      c.active
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
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
                    {onOpenProfile && (
                      <button
                        type="button"
                        onClick={() => onOpenProfile(c)}
                        title="Ver ficha comercial y compras históricas del cliente"
                        className="px-2 py-1 text-xs font-semibold rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-white transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <User className="w-3 h-3" />
                        <span>Ficha</span>
                      </button>
                    )}
                    {onOpenStatement && (
                      <button
                        type="button"
                        onClick={() => onOpenStatement(c)}
                        title="Ver e imprimir estado de cuenta corriente A4"
                        className="px-2 py-1 text-xs font-semibold rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <FileSpreadsheet className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                        <span>Cta. Cte.</span>
                      </button>
                    )}
                    {onOpenPayment && (
                      <button
                        type="button"
                        onClick={() => onOpenPayment(c)}
                        title="Registrar cobranza y emitir recibo A4"
                        className="px-2 py-1 text-xs font-semibold rounded bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Cobrar</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onToggleStatus(c.id, !c.active)}
                      aria-label={`${c.active ? 'Desactivar' : 'Reactivar'} cliente ${c.name}`}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:bg-zinc-300 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-zinc-900"
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
