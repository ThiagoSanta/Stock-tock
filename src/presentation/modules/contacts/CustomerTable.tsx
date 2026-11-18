import React from 'react';
import { CustomerWithMetrics } from '@/core/domain/contacts/types';
import { Users, Mail, Phone, MapPin, ShoppingCart, CheckCircle2, XCircle } from 'lucide-react';

interface CustomerTableProps {
  customers: CustomerWithMetrics[];
  loading: boolean;
  onToggleStatus: (id: string, newStatus: boolean) => void;
}

export function CustomerTable({ customers, loading, onToggleStatus }: CustomerTableProps) {
  if (loading) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs">
        <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Cargando clientes...</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
        <Users className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <h4 className="text-xs font-semibold text-slate-900">No se encontraron clientes</h4>
        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
          Registrá tus clientes para vincular sus ventas y pedidos.
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
              <th className="py-2.5 px-3">Cliente / Razón Social</th>
              <th className="py-2.5 px-3">Identificación Fiscal</th>
              <th className="py-2.5 px-3">Contacto Directo</th>
              <th className="py-2.5 px-3">Dirección</th>
              <th className="py-2.5 px-3 text-center">Compras</th>
              <th className="py-2.5 px-3 text-right">Total Facturado</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
              <th className="py-2.5 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2 px-3">
                  <div className="font-medium text-slate-900">{c.name}</div>
                  {c.notes && (
                    <div className="text-[10px] text-slate-400 truncate max-w-xs">{c.notes}</div>
                  )}
                </td>
                <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                  {c.taxId || <span className="text-slate-400 italic">Consumidor Final</span>}
                </td>
                <td className="py-2 px-3 text-slate-700">
                  <div className="space-y-0.5">
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{c.email}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                    {!c.email && !c.phone && <span className="text-slate-400">-</span>}
                  </div>
                </td>
                <td className="py-2 px-3 text-slate-500 max-w-xs truncate">
                  {c.address ? (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-2 px-3 text-center">
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                    <ShoppingCart className="w-3 h-3 text-slate-400" />
                    {c.totalOrdersCount}
                  </div>
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                  ${c.totalSpent.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                      c.active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {c.active ? (
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
                    onClick={() => onToggleStatus(c.id, !c.active)}
                    className="px-2 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    {c.active ? 'Desactivar' : 'Reactivar'}
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
