import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Receipt, DollarSign, TrendingUp, ShoppingBag, Search, Calculator } from 'lucide-react';
import { SaleWithDetails } from '@/core/application/ports/ISaleRepository';
import { SupabaseSaleRepository } from '@/core/infrastructure/repositories/SupabaseSaleRepository';
import { GetSalesHistoryUseCase } from '@/core/application/use-cases/sales/GetSalesHistoryUseCase';
import { SalesTable } from '@/presentation/modules/sales/SalesTable';
import { SaleA4InvoiceModal } from '@/presentation/modules/sales/SaleA4InvoiceModal';
import { CashShiftModal } from '@/presentation/modules/sales/CashShiftModal';
import { SaleReturnModal } from '@/presentation/modules/sales/SaleReturnModal';
import { MetricCard } from '@/presentation/components/MetricCard';
import { getCompanyContext } from '@/utils/supabase/companyContext';

export function SalesPage() {
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('Stock·tock');
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);
  const [returnSale, setReturnSale] = useState<SaleWithDetails | null>(null);
  const [isCashShiftOpen, setIsCashShiftOpen] = useState(false);
  const [originFilter, setOriginFilter] = useState<'ALL' | 'VENTA_DIRECTA_MOSTRADOR' | 'PEDIDO_DESPACHADO'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const saleRepo = useMemo(() => new SupabaseSaleRepository(), []);
  const getSalesUseCase = useMemo(() => new GetSalesHistoryUseCase(saleRepo), [saleRepo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const context = await getCompanyContext();
      if (context) {
        setCompanyId(context.companyId);
        if (context.companyName) setCompanyName(context.companyName);

        const salesList = await getSalesUseCase.execute(context.companyId, {
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link
              to="/"
              className="hover:text-slate-700 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-100 text-slate-800 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Historial de Ventas & Comprobantes
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCashShiftOpen(true)}
          className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Arqueo / Cierre de Caja</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
          subtitle="Sobre costo histórico"
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
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por comprobante (ej: VTA-...), cliente o pago..."
            className="w-full h-8 pl-8 pr-3 rounded bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors shadow-xs"
          />
        </div>

        {/* Tabs de Filtro por Canal de Origen */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200 text-xs w-fit">
          {[
            { id: 'ALL', label: 'Todas' },
            { id: 'VENTA_DIRECTA_MOSTRADOR', label: 'Mostrador POS' },
            { id: 'PEDIDO_DESPACHADO', label: 'Despachos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setOriginFilter(tab.id as any)}
              className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                originFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
        onOpenReturn={(s) => setReturnSale(s)}
      />

      {/* Modal de Comprobante A4 */}
      <SaleA4InvoiceModal
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
      />

      {/* Modal de Arqueo y Cierre de Caja Diario */}
      <CashShiftModal
        isOpen={isCashShiftOpen}
        onClose={() => setIsCashShiftOpen(false)}
        sales={sales}
        companyName={companyName}
      />

      {/* Modal de Devolución / Cambio de Mercadería */}
      {returnSale && (
        <SaleReturnModal
          isOpen={!!returnSale}
          onClose={() => setReturnSale(null)}
          sale={returnSale}
          companyName={companyName}
          onReturnComplete={loadData}
        />
      )}
    </div>
  );
}
