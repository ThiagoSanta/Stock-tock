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
    <section
      aria-label="Reglas de negocio inviolables del sistema"
      className="rounded-lg bg-white border border-slate-200 p-4 space-y-3.5 shadow-xs"
    >
      <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
        <div
          aria-hidden="true"
          className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Reglas de Negocio Inviolables (V1)
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            Parámetros del motor transaccional protegidos por arquitectura y base de datos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {INVIOLABLE_RULES.map((rule, idx) => (
          <article
            key={idx}
            className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-900 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-700" aria-hidden="true" />
                  {rule.code}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> {rule.status}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">{rule.title}</h4>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">{rule.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
