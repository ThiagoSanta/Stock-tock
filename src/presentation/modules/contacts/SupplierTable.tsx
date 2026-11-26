import React from 'react';
import { SupplierWithMetrics } from '@/core/domain/contacts/types';
import { Truck, Mail, Phone, User, CheckCircle2, XCircle, FileSpreadsheet, Banknote } from 'lucide-react';

interface SupplierTableProps {
  suppliers: SupplierWithMetrics[];
  loading: boolean;
  onToggleStatus: (id: string, newStatus: boolean) => void;
  onOpenPayment?: (supplier: SupplierWithMetrics) => void;
  onOpenStatement?: (supplier: SupplierWithMetrics) => void;
}

export function SupplierTable({
  suppliers,
  loading,
  onToggleStatus,
  onOpenPayment,
  onOpenStatement,
}: SupplierTableProps) {
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
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Cargando directorio de proveedores...</p>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-xs">
        <Truck className="w-6 h-6 text-zinc-400 dark:text-zinc-500 mx-auto mb-2" aria-hidden="true" />
        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">No se encontraron proveedores</h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto font-medium">
          Registrá tus proveedores mayoristas para emitir órdenes de compra y calcular el PPP.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Directorio de proveedores comerciales y compras acumuladas</caption>
          <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th scope="col" className="py-3 px-3">Proveedor / Empresa</th>
              <th scope="col" className="py-3 px-3">CUIT Fiscal</th>
              <th scope="col" className="py-3 px-3">Persona de Contacto</th>
              <th scope="col" className="py-3 px-3">Vías de Comunicación</th>
              <th scope="col" className="py-3 px-3 text-center">Órdenes</th>
              <th scope="col" className="py-3 px-3 text-right">Volumen Comprado</th>
              <th scope="col" className="py-3 px-3 text-right">Saldo Deuda</th>
              <th scope="col" className="py-3 px-3 text-center">Estado</th>
              <th scope="col" className="py-3 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{s.name}</div>
                  {s.notes && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-xs">{s.notes}</div>
                  )}
                </td>
                <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                  {s.taxId || <span className="text-zinc-500 dark:text-zinc-400 italic">Sin CUIT</span>}
                </td>
                <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300">
                  {s.contactName ? (
                    <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                      <User className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" aria-hidden="true" />
                      <span className="font-medium">{s.contactName}</span>
                    </div>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500">-</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300">
                  <div className="space-y-0.5">
                    {s.email && (
                      <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                        <Mail className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" aria-hidden="true" />
                        <span className="font-medium">{s.email}</span>
                      </div>
                    )}
                    {s.phone && (
                      <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                        <Phone className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" aria-hidden="true" />
                        <span className="font-medium">{s.phone}</span>
                      </div>
                    )}
                    {!s.email && !s.phone && <span className="text-zinc-400 dark:text-zinc-500">-</span>}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-xs font-semibold">
                    <Truck className="w-3 h-3 text-zinc-600 dark:text-zinc-400" aria-hidden="true" />
                    {s.totalPurchasesCount}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  ${s.totalSpent.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                  <span
                    className={
                      (s.currentBalance ?? 0) > 0
                        ? 'text-amber-800 dark:text-amber-300'
                        : 'text-emerald-800 dark:text-emerald-300'
                    }
                  >
                    ${(s.currentBalance ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                      s.active
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {s.active ? (
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
                    {onOpenPayment && (
                      <button
                        type="button"
                        onClick={() => onOpenPayment(s)}
                        title="Registrar pago a proveedor"
                        className="px-2 py-1 text-xs font-semibold rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-white transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Banknote className="w-3 h-3" />
                        <span>Pago</span>
                      </button>
                    )}
                    {onOpenStatement && (
                      <button
                        type="button"
                        onClick={() => onOpenStatement(s)}
                        title="Ver resumen y estado de cuenta corriente"
                        className="px-2 py-1 text-xs font-semibold rounded bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <FileSpreadsheet className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                        <span>Cta. Cte.</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onToggleStatus(s.id, !s.active)}
                      aria-label={`${s.active ? 'Desactivar' : 'Reactivar'} proveedor ${s.name}`}
                      className="px-2 py-1 text-xs font-semibold rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:bg-zinc-300 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
                    >
                      {s.active ? 'Baja' : 'Alta'}
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
