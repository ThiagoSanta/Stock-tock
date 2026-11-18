import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Boxes, History, SlidersHorizontal, PackageCheck, Clock } from 'lucide-react';
import {
  InventoryStockDetailed,
  StockMovementDetailed,
} from '@/core/application/ports/IInventoryRepository';
import { SupabaseInventoryRepository } from '@/core/infrastructure/repositories/SupabaseInventoryRepository';
import { GetInventoryBalanceUseCase } from '@/core/application/use-cases/inventory/GetInventoryBalanceUseCase';
import { GetKardexUseCase } from '@/core/application/use-cases/inventory/GetKardexUseCase';
import { AdjustStockUseCase } from '@/core/application/use-cases/inventory/AdjustStockUseCase';
import { InventoryStockTable } from '@/presentation/modules/inventory/InventoryStockTable';
import { KardexTable } from '@/presentation/modules/inventory/KardexTable';
import { StockAdjustmentModal } from '@/presentation/modules/inventory/StockAdjustmentModal';
import { MetricCard } from '@/presentation/components/MetricCard';
import { createClient } from '@/utils/supabase/client';

export function InventoryPage() {
  const [stockList, setStockList] = useState<InventoryStockDetailed[]>([]);
  const [kardexMovements, setKardexMovements] = useState<StockMovementDetailed[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'STOCK' | 'KARDEX'>('STOCK');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<InventoryStockDetailed | undefined>();

  const repo = useMemo(() => new SupabaseInventoryRepository(), []);
  const getBalanceUseCase = useMemo(() => new GetInventoryBalanceUseCase(repo), [repo]);
  const getKardexUseCase = useMemo(() => new GetKardexUseCase(repo), [repo]);
  const adjustStockUseCase = useMemo(() => new AdjustStockUseCase(repo), [repo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: companies } = await supabase.from('companies').select('id').limit(1);

      if (companies && companies.length > 0) {
        const cId = companies[0].id;
        setCompanyId(cId);

        const { data: wh } = await supabase
          .from('warehouses')
          .select('id')
          .eq('company_id', cId)
          .eq('is_default', true)
          .single();

        if (wh) setWarehouseId(wh.id);

        const [stocks, movs] = await Promise.all([
          getBalanceUseCase.execute(cId),
          getKardexUseCase.execute(cId, { limit: 100 }),
        ]);

        setStockList(stocks);
        setKardexMovements(movs);
      }
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [getBalanceUseCase, getKardexUseCase]);

  const handleConfirmAdjust = async (
    dto: Parameters<typeof adjustStockUseCase.execute>[0]
  ) => {
    if (!companyId || !warehouseId) throw new Error('Empresa o depósito no configurado.');
    await adjustStockUseCase.execute({
      ...dto,
      companyId,
      warehouseId,
    });
    await loadData();
  };

  const handleOpenAdjust = (item?: InventoryStockDetailed) => {
    setSelectedStockItem(item);
    setIsAdjustModalOpen(true);
  };

  // KPIs
  const totalPhysical = stockList.reduce((sum, s) => sum + s.physicalStock, 0);
  const totalAvailable = stockList.reduce((sum, s) => sum + s.availableStock, 0);
  const totalReserved = stockList.reduce((sum, s) => sum + s.reservedStock, 0);
  const totalValuation = stockList.reduce((sum, s) => sum + s.totalValuation, 0);

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
              <Boxes className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Inventario & Kardex Multidepósito
            </h1>
          </div>
        </div>

        <button
          onClick={() => handleOpenAdjust()}
          className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Ajustar Stock Manual</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Stock Físico Total"
          value={`${totalPhysical} un.`}
          trend={`Valuado $${totalValuation.toLocaleString('es-AR')}`}
          isPositive={true}
          subtitle="En depósitos"
          icon={Boxes}
        />
        <MetricCard
          title="Stock Disponible"
          value={`${totalAvailable} un.`}
          trend="Libre"
          isPositive={true}
          subtitle="Apto para venta"
          icon={PackageCheck}
        />
        <MetricCard
          title="Stock Reservado"
          value={`${totalReserved} un.`}
          trend="Comprometido"
          isPositive={false}
          subtitle="En pedidos confirmados"
          icon={Clock}
        />
        <MetricCard
          title="Movimientos Auditados"
          value={`${kardexMovements.length}`}
          trend="Historial"
          isPositive={true}
          subtitle="En Kardex inmutable"
          icon={History}
        />
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200 text-xs w-fit">
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-all cursor-pointer ${
            activeTab === 'STOCK'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Existencias por Depósito</span>
        </button>
        <button
          onClick={() => setActiveTab('KARDEX')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-all cursor-pointer ${
            activeTab === 'KARDEX'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Kardex ({kardexMovements.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'STOCK' ? (
        <InventoryStockTable
          stockList={stockList}
          loading={loading}
          onOpenAdjustModal={handleOpenAdjust}
        />
      ) : (
        <KardexTable movements={kardexMovements} loading={loading} />
      )}

      {/* Modal de Ajuste Manual */}
      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        stockList={stockList}
        selectedItem={selectedStockItem}
        onConfirmAdjust={handleConfirmAdjust as any}
      />
    </div>
  );
}
