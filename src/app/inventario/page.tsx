'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
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

export default function InventoryPage() {
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
              <Boxes className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Inventario & Kardex Multidepósito
            </h1>
          </div>
        </div>

        <button
          onClick={() => handleOpenAdjust()}
          className="h-9 px-4 rounded-lg bg-[#84cc16] hover:bg-[#74b412] text-black text-xs font-semibold shadow-[0_0_15px_rgba(132,204,22,0.25)] transition-all flex items-center gap-1.5 shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Ajustar Stock Manual</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Stock Físico Total"
          value={`${totalPhysical} un.`}
          trend={`Valuado $${totalValuation.toLocaleString('es-AR')}`}
          isPositive={true}
          subtitle="En depósitos de la empresa"
          icon={Boxes}
        />
        <MetricCard
          title="Stock Disponible"
          value={`${totalAvailable} un.`}
          trend="Libre"
          isPositive={true}
          subtitle="Apto para venta o reserva"
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
          subtitle="Registros en el Kardex"
          icon={History}
        />
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#141518] border border-[#27272a] text-xs w-fit">
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md font-medium transition-all ${
            activeTab === 'STOCK'
              ? 'bg-[#22242a] text-[#84cc16]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Existencias por Depósito</span>
        </button>
        <button
          onClick={() => setActiveTab('KARDEX')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md font-medium transition-all ${
            activeTab === 'KARDEX'
              ? 'bg-[#22242a] text-[#84cc16]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Kardex Inmutable ({kardexMovements.length})</span>
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
