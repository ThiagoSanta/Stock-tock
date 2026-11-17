'use client';

import React from 'react';
import { SupplierWithMetrics } from '@/core/domain/contacts/types';
import { Truck, Mail, Phone, MapPin, User, CheckCircle2, XCircle } from 'lucide-react';

interface SupplierTableProps {
  suppliers: SupplierWithMetrics[];
  loading: boolean;
  onToggleStatus: (id: string, newStatus: boolean) => void;
}

export function SupplierTable({ suppliers, loading, onToggleStatus }: SupplierTableProps) {
  if (loading) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226]">
        <div className="w-6 h-6 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-zinc-400">Cargando base de proveedores...</p>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226] space-y-2">
        <Truck className="w-8 h-8 text-zinc-600 mx-auto" />
        <h4 className="text-sm font-semibold text-zinc-300">No se encontraron proveedores</h4>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          Registrá tus proveedores mayoristas o fabricantes para emitir órdenes de compra y calcular el PPP.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#121214] border border-[#222226] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#161619] border-b border-[#222226] text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-3 px-4">Proveedor / Empresa</th>
              <th className="py-3 px-4">CUIT Fiscal</th>
              <th className="py-3 px-4">Persona de Contacto</th>
              <th className="py-3 px-4">Vías de Comunicación</th>
              <th className="py-3 px-4 text-center">Órdenes</th>
              <th className="py-3 px-4 text-right">Volumen Comprado</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1c1c20]">
            {suppliers.map((s) => {
              return (
                <tr key={s.id} className="hover:bg-[#16161a] transition-colors">
                  <td className="py-3 px-4 font-medium text-zinc-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-[#27272a] flex items-center justify-center font-mono font-bold text-xs text-[#84cc16]">
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-100">{s.name}</div>
                        {s.notes && (
                          <div className="text-[11px] text-zinc-500 truncate max-w-xs">{s.notes}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-300 font-mono text-[11px]">
                    {s.taxId || <span className="text-zinc-600 italic">Sin CUIT</span>}
                  </td>
                  <td className="py-3 px-4 text-zinc-300">
                    {s.contactName ? (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-zinc-500" />
                        <span>{s.contactName}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-zinc-300">
                    <div className="space-y-0.5">
                      {s.email ? (
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Mail className="w-3 h-3 text-zinc-500" />
                          <span>{s.email}</span>
                        </div>
                      ) : null}
                      {s.phone ? (
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          <span>{s.phone}</span>
                        </div>
                      ) : null}
                      {!s.email && !s.phone && <span className="text-zinc-600">-</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900 border border-[#27272a] text-zinc-300 font-mono text-[11px]">
                      <Truck className="w-3 h-3 text-zinc-500" />
                      {s.totalPurchasesCount}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-amber-400">
                    ${s.totalSpent.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        s.active
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800'
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
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onToggleStatus(s.id, !s.active)}
                      className="px-2.5 py-1 text-[11px] rounded bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                    >
                      {s.active ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
