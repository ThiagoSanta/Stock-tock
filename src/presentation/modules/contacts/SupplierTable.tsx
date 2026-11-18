import React from 'react';
import { SupplierWithMetrics } from '@/core/domain/contacts/types';
import { Truck, Mail, Phone, User, CheckCircle2, XCircle } from 'lucide-react';

interface SupplierTableProps {
  suppliers: SupplierWithMetrics[];
  loading: boolean;
  onToggleStatus: (id: string, newStatus: boolean) => void;
}

export function SupplierTable({ suppliers, loading, onToggleStatus }: SupplierTableProps) {
  if (loading) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs">
        <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Cargando proveedores...</p>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
        <Truck className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <h4 className="text-xs font-semibold text-slate-900">No se encontraron proveedores</h4>
        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
          Registrá tus proveedores mayoristas para emitir órdenes de compra y calcular el PPP.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-2.5 px-3">Proveedor / Empresa</th>
              <th className="py-2.5 px-3">CUIT Fiscal</th>
              <th className="py-2.5 px-3">Persona de Contacto</th>
              <th className="py-2.5 px-3">Vías de Comunicación</th>
              <th className="py-2.5 px-3 text-center">Órdenes</th>
              <th className="py-2.5 px-3 text-right">Volumen Comprado</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
              <th className="py-2.5 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2 px-3">
                  <div className="font-medium text-slate-900">{s.name}</div>
                  {s.notes && (
                    <div className="text-[10px] text-slate-400 truncate max-w-xs">{s.notes}</div>
                  )}
                </td>
                <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                  {s.taxId || <span className="text-slate-400 italic">Sin CUIT</span>}
                </td>
                <td className="py-2 px-3 text-slate-700">
                  {s.contactName ? (
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{s.contactName}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-2 px-3 text-slate-700">
                  <div className="space-y-0.5">
                    {s.email && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{s.email}</span>
                      </div>
                    )}
                    {s.phone && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{s.phone}</span>
                      </div>
                    )}
                    {!s.email && !s.phone && <span className="text-slate-400">-</span>}
                  </div>
                </td>
                <td className="py-2 px-3 text-center">
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                    <Truck className="w-3 h-3 text-slate-400" />
                    {s.totalPurchasesCount}
                  </div>
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                  ${s.totalSpent.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                      s.active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {s.active ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5" /> Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-2.5 h-2.5" /> Inactivo
                      </>
                    )}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  <button
                    onClick={() => onToggleStatus(s.id, !s.active)}
                    className="px-2 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    {s.active ? 'Desactivar' : 'Reactivar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
