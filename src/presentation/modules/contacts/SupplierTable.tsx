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
        className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs"
      >
        <div
          aria-hidden="true"
          className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"
        />
        <p className="text-xs font-semibold text-slate-700">Cargando directorio de proveedores...</p>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
        <Truck className="w-6 h-6 text-slate-400 mx-auto mb-2" aria-hidden="true" />
        <h4 className="text-xs font-bold text-slate-900">No se encontraron proveedores</h4>
        <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
          Registrá tus proveedores mayoristas para emitir órdenes de compra y calcular el PPP.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Directorio de proveedores comerciales y compras acumuladas</caption>
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-bold">
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
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-slate-900">{s.name}</div>
                  {s.notes && (
                    <div className="text-xs text-slate-500 truncate max-w-xs">{s.notes}</div>
                  )}
                </td>
                <td className="py-2.5 px-3 text-slate-700 font-mono text-xs">
                  {s.taxId || <span className="text-slate-500 italic">Sin CUIT</span>}
                </td>
                <td className="py-2.5 px-3 text-slate-700">
                  {s.contactName ? (
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      <span className="font-medium">{s.contactName}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-slate-700">
                  <div className="space-y-0.5">
                    {s.email && (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                        <span className="font-medium">{s.email}</span>
                      </div>
                    )}
                    {s.phone && (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                        <span className="font-medium">{s.phone}</span>
                      </div>
                    )}
                    {!s.email && !s.phone && <span className="text-slate-400">-</span>}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs font-semibold">
                    <Truck className="w-3 h-3 text-slate-600" aria-hidden="true" />
                    {s.totalPurchasesCount}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                  ${s.totalSpent.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                  <span
                    className={
                      (s.currentBalance ?? 0) > 0
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }
                  >
                    ${(s.currentBalance ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                      s.active
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
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
                        className="px-2 py-1 text-xs font-semibold rounded bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
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
                        className="px-2 py-1 text-xs font-semibold rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <FileSpreadsheet className="w-3 h-3 text-slate-500" />
                        <span>Cta. Cte.</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onToggleStatus(s.id, !s.active)}
                      aria-label={`${s.active ? 'Desactivar' : 'Reactivar'} proveedor ${s.name}`}
                      className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 border border-slate-300 transition-colors cursor-pointer"
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
