import React, { useEffect, useState, useMemo } from 'react';
import { Truck, Plus, ArrowUpDown } from 'lucide-react';
import { PageHeader, Button } from '@/presentation/components/ui';
import { Purchase, Supplier, PurchaseStatus } from '@/core/domain/purchases/types';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';
import { SupabasePurchaseRepository } from '@/core/infrastructure/repositories/SupabasePurchaseRepository';
import { SupabaseProductRepository } from '@/core/infrastructure/repositories/SupabaseProductRepository';
import { CreatePurchaseUseCase } from '@/core/application/use-cases/purchases/CreatePurchaseUseCase';
import { ReceivePurchaseUseCase } from '@/core/application/use-cases/purchases/ReceivePurchaseUseCase';
import { PurchaseTable } from '@/presentation/modules/purchases/PurchaseTable';
import { PurchaseModal } from '@/presentation/modules/purchases/PurchaseModal';
import { PurchaseDetailModal } from '@/presentation/modules/purchases/PurchaseDetailModal';
import { SupplierCostComparisonModal } from '@/presentation/modules/purchases/SupplierCostComparisonModal';
import { getCompanyContext } from '@/utils/supabase/companyContext';

export function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCostComparisonOpen, setIsCostComparisonOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | PurchaseStatus>('ALL');

  const purchaseRepo = useMemo(() => new SupabasePurchaseRepository(), []);
  const productRepo = useMemo(() => new SupabaseProductRepository(), []);

  const createPurchaseUseCase = useMemo(() => new CreatePurchaseUseCase(purchaseRepo), [purchaseRepo]);
  const receivePurchaseUseCase = useMemo(() => new ReceivePurchaseUseCase(purchaseRepo), [purchaseRepo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const context = await getCompanyContext();
      if (context) {
        setCompanyId(context.companyId);
        setWarehouseId(context.defaultWarehouseId);

        const [purchasesList, prods, sups] = await Promise.all([
          purchaseRepo.findPurchases(context.companyId),
          productRepo.getProductsWithStock(context.companyId),
          purchaseRepo.findSuppliers(context.companyId),
        ]);

        setPurchases(purchasesList);
        setProducts(prods);
        setSuppliers(sups);
      }
    } catch (err) {
      console.error('Error cargando órdenes de compra:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [purchaseRepo, productRepo]);

  const handleCreatePurchase = async (
    dto: Parameters<typeof createPurchaseUseCase.execute>[0]
  ) => {
    if (!companyId || !warehouseId) throw new Error('Empresa o depósito no configurado.');
    await createPurchaseUseCase.execute({
      ...dto,
      companyId,
      warehouseId,
    });
    await loadData();
  };

  const handleReceivePurchase = async (purchaseId: string) => {
    if (!companyId) return;
    await receivePurchaseUseCase.execute(purchaseId, companyId);
    await loadData();
  };

  const filteredPurchases = useMemo(() => {
    if (statusFilter === 'ALL') return purchases;
    return purchases.filter((p) => p.status === statusFilter);
  }, [purchases, statusFilter]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Compras a Proveedores & Costo PPP"
        icon={<Truck className="w-3.5 h-3.5" />}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCostComparisonOpen(true)}
              title="Comparativa de costos entre proveedores para cada producto"
              leftIcon={<ArrowUpDown className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />}
            >
              Comparar Costos
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4 text-lime-400 dark:text-lime-600" />}
            >
              Nueva Orden de Compra
            </Button>
          </>
        }
      />

      {/* Tabs de Filtro por Estado */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs w-fit overflow-x-auto">
        {[
          { id: 'ALL', label: 'Todas' },
          { id: 'EMITIDA', label: 'Pendientes de Recepción' },
          { id: 'RECEPCION_TOTAL', label: 'Recibidas en Stock' },
          { id: 'CANCELADA', label: 'Canceladas' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabla de Compras */}
      <PurchaseTable
        purchases={filteredPurchases}
        loading={loading}
        onSelectPurchase={setSelectedPurchase}
        onReceivePurchase={handleReceivePurchase}
      />

      {/* Modal Crear Orden de Compra */}
      <PurchaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        products={products}
        suppliers={suppliers}
        onCreatePurchase={handleCreatePurchase as any}
      />

      {/* Modal Detalle de Compra y Recepción */}
      <PurchaseDetailModal
        purchase={selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        onReceive={handleReceivePurchase}
      />

      {/* Modal Comparativa de Costos por Proveedor */}
      <SupplierCostComparisonModal
        isOpen={isCostComparisonOpen}
        onClose={() => setIsCostComparisonOpen(false)}
        products={products}
        companyId={companyId}
      />
    </div>
  );
}
