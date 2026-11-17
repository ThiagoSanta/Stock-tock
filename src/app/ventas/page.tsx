'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Receipt, DollarSign, TrendingUp, ShoppingBag, Search } from 'lucide-react';
import { SaleWithDetails } from '@/core/application/ports/ISaleRepository';
import { SupabaseSaleRepository } from '@/core/infrastructure/repositories/SupabaseSaleRepository';
import { GetSalesHistoryUseCase } from '@/core/application/use-cases/sales/GetSalesHistoryUseCase';
import { SalesTable } from '@/presentation/modules/sales/SalesTable';
import { SaleReceiptModal } from '@/presentation/modules/sales/SaleReceiptModal';
import { MetricCard } from '@/presentation/components/MetricCard';
import { createClient } from '@/utils/supabase/client';

export default function SalesPage() {
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);
  const [originFilter, setOriginFilter] = useState<'ALL' | 'VENTA_DIRECTA_MOSTRADOR' | 'PEDIDO_DESPACHADO'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const saleRepo = useMemo(() => new SupabaseSaleRepository(), []);
  const getSalesUseCase = useMemo(() => new GetSalesHistoryUseCase(saleRepo), [saleRepo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: companies } = await supabase.from('companies').select('id').limit(1);

      if (companies && companies.length > 0) {
        const cId = companies[0].id;
        setCompanyId(cId);

        const salesList = await getSalesUseCase.execute(cId, {
          origin: originFilter !== 'ALL' ? originFilter : undefined,
        });

        setSales(salesList);
      }
    } catch (err) {
      console.error('Error cargando ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [getSalesUseCase, originFilter]);

  // Filtrado por buscador
  const filteredSales = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return sales;
    return sales.filter(
      (s) =>
        s.saleNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.paymentMethod.toLowerCase().includes(q)
    );
  }, [sales, searchTerm]);

  // KPIs
  const totalBilled = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalMargin = sales.reduce((acc, s) => acc + s.estimatedGrossMargin, 0);
  const averageTicket = sales.length > 0 ? totalBilled / sales.length : 0;
  const averageMarginPct = totalBilled > 0 ? (totalMargin / totalBilled) * 100 : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#222226]">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Link
              href="/"
              className="hover:text-zinc-300 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Historial de Ventas & Comprobantes
            </h1>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Facturación Histórica"
          value={`$${totalBilled.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
          trend={`${sales.length} ventas`}
          isPositive={true}
          subtitle="Total acumulado en V1"
          icon={DollarSign}
        />
        <MetricCard
          title="Margen Bruto Total"
          value={`$${totalMargin.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
          trend={`${Math.round(averageMarginPct)}% margen`}
          isPositive={true}
          subtitle="Ganancia bruta sobre costo histórico"
          icon={TrendingUp}
        />
        <MetricCard
          title="Ticket Promedio"
          value={`$${averageTicket.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
          trend="Promedio"
          isPositive={true}
          subtitle="Por operación concretada"
          icon={ShoppingBag}
        />
        <MetricCard
          title="Operaciones Asentadas"
          value={`${sales.length}`}
          trend="Completadas"
          isPositive={true}
          subtitle="Cobros y despachos efectivos"
          icon={Receipt}
        />
      </div>

      {/* Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por comprobante (ej: VTA-...), cliente o pago..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#141518] border border-[#27272a] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#84cc16] transition-colors"
          />
        </div>

        {/* Tabs de Filtro por Canal de Origen */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#141518] border border-[#27272a] text-xs w-fit">
          {[
            { id: 'ALL', label: 'Todas' },
            { id: 'VENTA_DIRECTA_MOSTRADOR', label: 'Mostrador POS' },
            { id: 'PEDIDO_DESPACHADO', label: 'Despachos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setOriginFilter(tab.id as any)}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                originFilter === tab.id
                  ? 'bg-[#22242a] text-[#84cc16]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Ventas */}
      <SalesTable
        sales={filteredSales}
        loading={loading}
        onSelectSale={setSelectedSale}
      />

      {/* Modal de Comprobante / Ticket */}
      <SaleReceiptModal
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
      />
    </div>
  );
}
