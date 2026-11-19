import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Truck, Plus, ArrowUpDown } from 'lucide-react';
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
              <Truck className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Compras a Proveedores & Costo PPP
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCostComparisonOpen(true)}
            title="Comparativa de costos entre proveedores para cada producto"
            className="h-8 px-3 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Comparar Costos</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Orden de Compra</span>
          </button>
        </div>
      </div>

      {/* Tabs de Filtro por Estado */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200 text-xs w-fit overflow-x-auto">
        {[
          { id: 'ALL', label: 'Todas' },
          { id: 'EMITIDA', label: 'Pendientes de Recepción' },
          { id: 'RECEPCION_TOTAL', label: 'Recibidas en Stock' },
          { id: 'CANCELADA', label: 'Canceladas' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
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
