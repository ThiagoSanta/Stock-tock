'use client';

import React from 'react';
import {
  Boxes,
  Plus,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import { MetricCard } from '@/presentation/components/MetricCard';

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = React.useState<string>('');

  React.useEffect(() => {
    setCurrentDate(
      new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'full',
      }).format(new Date())
    );
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#222226]">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Building2 className="w-3.5 h-3.5 text-[#84cc16]" />
            <span>Casa Central</span>
            <span>•</span>
            <Calendar className="w-3.5 h-3.5" />
            <span className="capitalize">{currentDate}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Control de Operaciones
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button className="h-9 px-3.5 rounded-lg bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-xs font-medium text-zinc-300 transition-colors flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Nuevo Pedido</span>
          </button>
          <button className="h-9 px-4 rounded-lg bg-[#84cc16] hover:bg-[#74b412] text-black text-xs font-semibold shadow-[0_0_20px_rgba(132,204,22,0.25)] transition-all flex items-center gap-1.5">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Venta Rápida (POS)</span>
          </button>
        </div>
      </div>

      {/* Reglas de Negocio V1 Status Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#121410] to-[#121214] border border-[#84cc16]/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center text-[#84cc16]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-200">
              Políticas de Integridad V1 Activas
            </h4>
            <p className="text-[11px] text-zinc-400">
              Bloqueo estricto de stock negativo • Costo promedio a nivel empresa • Ventas asentadas al despachar
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#84cc16]/10 text-[#84cc16] border border-[#84cc16]/20">
          SISTEMA PROTEGIDO
        </span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ventas del Mes"
          value="$1.482.900"
          trend="+18.4%"
          isPositive={true}
          subtitle="48 operaciones despachadas"
          icon={TrendingUp}
        />
        <MetricCard
          title="Stock Físico Total"
          value="4.820 un."
          trend="Valuado $14.2M"
          isPositive={true}
          subtitle="En 2 depósitos activos"
          icon={Boxes}
        />
        <MetricCard
          title="Stock Reservado"
          value="310 un."
          trend="8 pedidos"
          isPositive={false}
          subtitle="Comprometido sin despachar"
          icon={Clock}
        />
        <MetricCard
          title="Alertas de Reposición"
          value="4 ítems"
          trend="Crítico"
          isAlert={true}
          subtitle="Por debajo del stock mínimo"
          icon={AlertCircle}
        />
      </div>

      {/* Main Grid: Orders & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pedidos por despachar (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-[#121214] border border-[#222226] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222226]">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Pedidos Pendientes de Despacho
              </h3>
              <p className="text-xs text-zinc-500">
                Mercadería reservada lista para preparar y entregar
              </p>
            </div>
            <button className="text-xs text-[#84cc16] hover:underline flex items-center gap-1 font-medium">
              Ver todos los pedidos <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {[
              {
                id: 'PED-1042',
                customer: 'Distribuidora Norte SRL',
                items: '12 productos (140 un.)',
                total: '$428.500',
                status: 'EN_PREPARACION',
                badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              },
              {
                id: 'PED-1041',
                customer: 'Comercial Belgrano',
                items: '4 productos (35 un.)',
                total: '$112.000',
                status: 'CONFIRMADO',
                badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
              },
              {
                id: 'PED-1040',
                customer: 'Martín Gómez (Mostrador)',
                items: '2 productos (8 un.)',
                total: '$45.200',
                status: 'EN_PREPARACION',
                badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              },
            ].map((order) => (
              <div
                key={order.id}
                className="p-3.5 rounded-lg bg-[#161619] border border-[#222226] hover:border-[#2a2a30] transition-colors flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-zinc-200">
                      {order.id}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${order.badgeColor}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 font-medium">{order.customer}</p>
                  <p className="text-[11px] text-zinc-500">{order.items}</p>
                </div>

                <div className="text-right space-y-1.5">
                  <p className="text-sm font-bold font-mono text-zinc-100">
                    {order.total}
                  </p>
                  <button className="text-[11px] font-semibold px-2.5 py-1 rounded bg-[#84cc16]/10 hover:bg-[#84cc16]/20 text-[#84cc16] border border-[#84cc16]/30 transition-colors">
                    Despachar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Movimientos Recientes de Kardex (1 col) */}
        <div className="rounded-xl bg-[#121214] border border-[#222226] p-5 space-y-4">
          <div className="pb-3 border-b border-[#222226]">
            <h3 className="text-sm font-semibold text-zinc-100">
              Kardex de Inventario
            </h3>
            <p className="text-xs text-zinc-500">Últimos movimientos auditados</p>
          </div>

          <div className="space-y-3">
            {[
              {
                type: 'SALIDA_VENTA',
                product: 'Taladro Percutor 750W',
                qty: '-2 un.',
                balance: '48 un.',
                time: 'Hace 12 min',
                isNegative: true,
              },
              {
                type: 'RESERVA_PEDIDO',
                product: 'Set Destornilladores x6',
                qty: '+10 un.',
                balance: 'Reserva act.',
                time: 'Hace 35 min',
                isNegative: false,
              },
              {
                type: 'INGRESO_COMPRA',
                product: 'Disco Corte 115mm (Pack x10)',
                qty: '+100 un.',
                balance: '240 un.',
                time: 'Hace 2 horas',
                isNegative: false,
              },
              {
                type: 'SALIDA_AJUSTE',
                product: 'Cinta Métrica 5m',
                qty: '-1 un. (Rotura)',
                balance: '19 un.',
                time: 'Hace 4 horas',
                isNegative: true,
              },
            ].map((mov, i) => (
              <div
                key={i}
                className="pb-3 border-b border-[#1c1c20] last:border-0 flex items-start justify-between gap-3"
              >
                <div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1c1c20] text-zinc-400">
                    {mov.type}
                  </span>
                  <p className="text-xs font-medium text-zinc-200 mt-1 line-clamp-1">
                    {mov.product}
                  </p>
                  <p className="text-[10px] text-zinc-500">{mov.time}</p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-mono font-bold ${
                      mov.isNegative ? 'text-rose-400' : 'text-[#84cc16]'
                    }`}
                  >
                    {mov.qty}
                  </span>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    {mov.balance}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
