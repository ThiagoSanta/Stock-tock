import React, { useEffect, useState, useMemo } from 'react';
import { Boxes, History, SlidersHorizontal, PackageCheck, Clock, ArrowRightLeft } from 'lucide-react';
import { PageHeader, Button } from '@/presentation/components/ui';
import {
  InventoryStockDetailed,
  StockMovementDetailed,
} from '@/core/application/ports/IInventoryRepository';
import { SupabaseInventoryRepository } from '@/core/infrastructure/repositories/SupabaseInventoryRepository';
import { GetInventoryBalanceUseCase } from '@/core/application/use-cases/inventory/GetInventoryBalanceUseCase';
import { GetKardexUseCase } from '@/core/application/use-cases/inventory/GetKardexUseCase';
import { AdjustStockUseCase } from '@/core/application/use-cases/inventory/AdjustStockUseCase';
import { TransferStockUseCase } from '@/core/application/use-cases/inventory/TransferStockUseCase';
import { InventoryStockTable } from '@/presentation/modules/inventory/InventoryStockTable';
import { KardexTable } from '@/presentation/modules/inventory/KardexTable';
import { StockAdjustmentModal } from '@/presentation/modules/inventory/StockAdjustmentModal';
import { TransferStockModal } from '@/presentation/modules/inventory/TransferStockModal';
import { TransferHistoryModal } from '@/presentation/modules/inventory/TransferHistoryModal';
import { MetricCard } from '@/presentation/components/MetricCard';
import { getCompanyContext } from '@/utils/supabase/companyContext';
import { createClient } from '@/utils/supabase/client';
import { WarehouseSettings } from '@/core/domain/settings/types';

export function InventoryPage() {
  const [stockList, setStockList] = useState<InventoryStockDetailed[]>([]);
  const [kardexMovements, setKardexMovements] = useState<StockMovementDetailed[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseSettings[]>([]);
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('ALL');
  const [companyId, setCompanyId] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('Stock·tock');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'STOCK' | 'KARDEX'>('STOCK');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<InventoryStockDetailed | undefined>();

  const repo = useMemo(() => new SupabaseInventoryRepository(), []);
  const getBalanceUseCase = useMemo(() => new GetInventoryBalanceUseCase(repo), [repo]);
  const getKardexUseCase = useMemo(() => new GetKardexUseCase(repo), [repo]);
  const adjustStockUseCase = useMemo(() => new AdjustStockUseCase(repo), [repo]);
  const transferStockUseCase = useMemo(() => new TransferStockUseCase(repo), [repo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const context = await getCompanyContext();
      if (context) {
        setCompanyId(context.companyId);
        if (context.companyName) setCompanyName(context.companyName);
        setWarehouseId(context.defaultWarehouseId);

        const supabase = createClient();
        const [stocks, movs, whRes] = await Promise.all([
          getBalanceUseCase.execute(context.companyId),
          getKardexUseCase.execute(context.companyId, { limit: 100 }),
          supabase
            .from('warehouses')
            .select('*')
            .eq('company_id', context.companyId)
            .eq('active', true),
        ]);

        setStockList(stocks);
        setKardexMovements(movs);
        setWarehouses(
          (whRes.data || []).map((w: any) => ({
            id: w.id,
            companyId: w.company_id,
            name: w.name,
            code: w.code,
            address: w.address,
            isDefault: w.is_default,
            active: w.active,
          }))
        );
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

  const handleConfirmTransfer = async (data: {
    originWarehouseId: string;
    destinationWarehouseId: string;
    productId: string;
    quantity: number;
    reason: string;
  }) => {
    if (!companyId) throw new Error('Empresa no identificada.');
    const result = await transferStockUseCase.execute({
      companyId,
      originWarehouseId: data.originWarehouseId,
      destinationWarehouseId: data.destinationWarehouseId,
      productId: data.productId,
      quantity: data.quantity,
      reason: data.reason,
    });
    await loadData();
    return result;
  };

  const handleOpenAdjust = (item?: InventoryStockDetailed) => {
    setSelectedStockItem(item);
    setIsAdjustModalOpen(true);
  };

  // Filtro de inventario por depósito
  const filteredStockList = useMemo(() => {
    if (selectedWarehouseFilter === 'ALL') return stockList;
    return stockList.filter((s) => s.warehouseId === selectedWarehouseFilter);
  }, [stockList, selectedWarehouseFilter]);

  // KPIs
  const totalPhysical = filteredStockList.reduce((sum, s) => sum + s.physicalStock, 0);
  const totalAvailable = filteredStockList.reduce((sum, s) => sum + s.availableStock, 0);
  const totalReserved = filteredStockList.reduce((sum, s) => sum + s.reservedStock, 0);
  const totalValuation = filteredStockList.reduce((sum, s) => sum + s.totalValuation, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventario & Kardex Multidepósito"
        icon={<Boxes className="w-3.5 h-3.5" />}
        actions={
          <>
            {warehouses.length > 1 && (
              <select
                aria-label="Filtrar por depósito"
                value={selectedWarehouseFilter}
                onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                className="h-8 px-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-lime-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">Todos los depósitos ({warehouses.length})</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.isDefault ? '★' : ''}
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsTransferModalOpen(true)}
              disabled={warehouses.length < 2}
              title={
                warehouses.length < 2
                  ? 'Para transferir necesitás al menos 2 depósitos activos (crealos en Configuración)'
                  : 'Mover mercadería entre depósitos con remito interno'
              }
              leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
            >
              Transferir entre Depósitos
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsHistoryModalOpen(true)}
              title="Ver e imprimir historial de remitos de transferencia interna en A4"
              leftIcon={<History className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />}
            >
              Historial Remitos
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenAdjust()}
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />}
            >
              Ajustar Stock
            </Button>
          </>
        }
      />

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
      <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('STOCK')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
            activeTab === 'STOCK'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Existencias por Depósito</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('KARDEX')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
            activeTab === 'KARDEX'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Kardex ({kardexMovements.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'STOCK' ? (
        <InventoryStockTable
          stockList={filteredStockList}
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

      {/* Modal de Transferencia entre Depósitos */}
      <TransferStockModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        stockList={stockList}
        warehouses={warehouses}
        companyId={companyId}
        onConfirmTransfer={handleConfirmTransfer}
      />

      {/* Modal de Historial de Remitos de Transferencia */}
      <TransferHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        companyName={companyName}
      />
    </div>
  );
}
