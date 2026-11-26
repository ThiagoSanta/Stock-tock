import React, { useEffect, useState, useMemo } from 'react';
import { Receipt, DollarSign, TrendingUp, ShoppingBag, Search, Calculator, ArrowDownRight, Clock } from 'lucide-react';
import { PageHeader, Button, Badge, Input } from '@/presentation/components/ui';
import { SaleWithDetails } from '@/core/application/ports/ISaleRepository';
import { SupabaseSaleRepository } from '@/core/infrastructure/repositories/SupabaseSaleRepository';
import { GetSalesHistoryUseCase } from '@/core/application/use-cases/sales/GetSalesHistoryUseCase';
import { SalesTable } from '@/presentation/modules/sales/SalesTable';
import { SaleA4InvoiceModal } from '@/presentation/modules/sales/SaleA4InvoiceModal';
import { CashShiftModal } from '@/presentation/modules/sales/CashShiftModal';
import { CashShiftOpenModal, CashShift } from '@/presentation/modules/sales/CashShiftOpenModal';
import { CashMovementModal } from '@/presentation/modules/sales/CashMovementModal';
import { SaleReturnModal } from '@/presentation/modules/sales/SaleReturnModal';
import { MetricCard } from '@/presentation/components/MetricCard';
import { getCompanyContext } from '@/utils/supabase/companyContext';
import { createClient } from '@/utils/supabase/client';

export function SalesPage() {
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('Stock·tock');
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);
  const [returnSale, setReturnSale] = useState<SaleWithDetails | null>(null);
  const [isCashShiftOpen, setIsCashShiftOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [activeShift, setActiveShift] = useState<CashShift | null>(null);
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

        // Consultar si hay turno abierto actualmente
        const supabase = createClient();
        const { data: shiftData } = await supabase
          .from('cash_shifts')
          .select('*')
          .eq('company_id', context.companyId)
          .eq('status', 'ABIERTO')
          .order('opened_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (shiftData) {
          setActiveShift({
            id: shiftData.id,
            companyId: shiftData.company_id,
            shiftType: shiftData.shift_type,
            cashierName: shiftData.cashier_name,
            initialCash: Number(shiftData.initial_cash || 0),
            status: shiftData.status,
            notes: shiftData.notes,
            openedAt: shiftData.opened_at,
          });
        } else {
          setActiveShift(null);
        }
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
      <PageHeader
        title="Historial de Ventas & Comprobantes"
        icon={<Receipt className="w-3.5 h-3.5" />}
        actions={
          <>
            {activeShift ? (
              <Badge variant="success" dot pulse className="h-8 px-2.5">
                Caja Abierta: {activeShift.shiftType.replace('TURNO_', '')} (Fondo: ${activeShift.initialCash.toLocaleString('es-AR')})
              </Badge>
            ) : (
              <Button
                variant="success"
                size="sm"
                onClick={() => setIsOpenShiftModalOpen(true)}
                leftIcon={<Clock className="w-3.5 h-3.5" />}
              >
                Abrir Turno Caja
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsMovementModalOpen(true)}
              title="Asentar gasto menor, flete o aporte en efectivo"
              leftIcon={<ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
            >
              + Gasto / Mov. Caja
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCashShiftOpen(true)}
              leftIcon={<Calculator className="w-3.5 h-3.5" />}
            >
              Arqueo / Cierre de Caja
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Facturación Histórica"
          value={`$${totalBilled.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
          trend={`${sales.length} ventas`}
          isPositive={true}
          subtitle="Total histórico acumulado"
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
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por comprobante (ej: VTA-...), cliente o pago..."
            leftIcon={<Search className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Tabs de Filtro por Canal de Origen */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs w-fit">
          {[
            { id: 'ALL', label: 'Todas' },
            { id: 'VENTA_DIRECTA_MOSTRADOR', label: 'Mostrador POS' },
            { id: 'PEDIDO_DESPACHADO', label: 'Despachos' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setOriginFilter(tab.id as any)}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                originFilter === tab.id
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
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

      {/* Modal de Apertura de Turno */}
      {isOpenShiftModalOpen && (
        <CashShiftOpenModal
          isOpen={isOpenShiftModalOpen}
          onClose={() => setIsOpenShiftModalOpen(false)}
          companyId={companyId}
          onShiftOpened={(shift) => {
            setActiveShift(shift);
            loadData();
          }}
        />
      )}

      {/* Modal de Movimiento de Caja Chica (Gastos / Aportes) */}
      {isMovementModalOpen && (
        <CashMovementModal
          isOpen={isMovementModalOpen}
          onClose={() => setIsMovementModalOpen(false)}
          companyId={companyId}
          companyName={companyName}
          onMovementCreated={loadData}
        />
      )}

      {/* Modal de Arqueo y Cierre de Caja Diario */}
      <CashShiftModal
        isOpen={isCashShiftOpen}
        onClose={() => setIsCashShiftOpen(false)}
        sales={sales}
        companyId={companyId}
        companyName={companyName}
        activeShift={activeShift}
        onShiftClosed={() => {
          setActiveShift(null);
          loadData();
        }}
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
