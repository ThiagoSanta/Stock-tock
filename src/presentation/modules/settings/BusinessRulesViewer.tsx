'use client';

import React from 'react';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

const INVIOLABLE_RULES = [
  {
    code: 'RULE-1: BLOCK',
    title: 'Cero Stock Negativo Inviolable',
    description:
      'Garantizado por CHECK constraints a nivel de motor PostgreSQL (physical_stock >= 0 y available_stock >= 0) y validación previa en los casos de uso.',
    status: 'Activo en Motor DB',
  },
  {
    code: 'RULE-2: MANUAL',
    title: 'Liberación Humana de Reservas',
    description:
      'Los pedidos confirmados retienen stock disponible sin caducidad silenciosa. Solo el usuario despacha o cancela manualmente.',
    status: 'Activo en Módulo Pedidos',
  },
  {
    code: 'RULE-3: SINGLE',
    title: 'Moneda Unificada (ARS)',
    description:
      'Toda la valuación, compras, ventas y balances operan en pesos argentinos (ARS) para evitar distorsiones cambiarias en V1.',
    status: 'Activo en Empresa',
  },
  {
    code: 'RULE-4: COMPANY',
    title: 'Costo Promedio Ponderado Global (PPP)',
    description:
      'El costo de los productos se recalcula a nivel empresa con cada recepción de compra usando el promedio ponderado consolidado.',
    status: 'Activo en Módulo Compras',
  },
  {
    code: 'RULE-5: DISPATCH',
    title: 'Deducción Física Estricta al Despacho',
    description:
      'El stock físico solo disminuye cuando la mercadería sale físicamente del depósito, registrando la venta y Kardex en ese instante.',
    status: 'Activo en Despachos & POS',
  },
];

export function BusinessRulesViewer() {
  return (
    <div className="rounded-xl bg-[#121214] border border-[#222226] p-6 space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-[#222226]">
        <div className="p-2 rounded-lg bg-zinc-800 text-[#84cc16]">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-100 text-sm">
            Reglas de Negocio Inviolables (V1)
          </h3>
          <p className="text-xs text-zinc-400">
            Parámetros del motor transaccional protegidos por arquitectura limpia y base de datos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {INVIOLABLE_RULES.map((rule, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-lg bg-[#18181b] border border-[#27272a] space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#84cc16] flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  {rule.code}
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/60">
                  <CheckCircle2 className="w-2.5 h-2.5" /> {rule.status}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-zinc-200">{rule.title}</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{rule.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
