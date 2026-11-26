import React, { useEffect, useState, useMemo } from 'react';
import { Package } from 'lucide-react';
import { PageHeader } from '@/presentation/components/ui';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';
import { SupabaseProductRepository } from '@/core/infrastructure/repositories/SupabaseProductRepository';
import { CreateProductUseCase } from '@/core/application/use-cases/catalog/CreateProductUseCase';
import { GetProductsWithStockUseCase } from '@/core/application/use-cases/catalog/GetProductsWithStockUseCase';
import { ProductFilters } from '@/presentation/modules/catalog/ProductFilters';
import { ProductTable } from '@/presentation/modules/catalog/ProductTable';
import { ProductModal } from '@/presentation/modules/catalog/ProductModal';
import { PriceListModal } from '@/presentation/modules/catalog/PriceListModal';
import { ProductImportModal } from '@/presentation/modules/catalog/ProductImportModal';
import { LabelGeneratorModal } from '@/presentation/modules/catalog/LabelGeneratorModal';
import { LotManagementModal } from '@/presentation/modules/inventory/LotManagementModal';
import { BulkPriceUpdateModal } from '@/presentation/modules/catalog/BulkPriceUpdateModal';
import { SupplierCostComparisonModal } from '@/presentation/modules/purchases/SupplierCostComparisonModal';
import { getCompanyContext } from '@/utils/supabase/companyContext';

export function ProductsPage() {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('Stock·tock');
  const [defaultWarehouseId, setDefaultWarehouseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPriceListOpen, setIsPriceListOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isLabelsOpen, setIsLabelsOpen] = useState(false);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [isCostComparisonOpen, setIsCostComparisonOpen] = useState(false);
  const [selectedProductForLots, setSelectedProductForLots] = useState<ProductWithStock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'NORMAL' | 'LOW' | 'OUT'>('ALL');

  const repo = useMemo(() => new SupabaseProductRepository(), []);
  const getProductsUseCase = useMemo(() => new GetProductsWithStockUseCase(repo), [repo]);
  const createProductUseCase = useMemo(() => new CreateProductUseCase(repo), [repo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const context = await getCompanyContext();
      if (context) {
        setCompanyId(context.companyId);
        if (context.companyName) setCompanyName(context.companyName);
        if (context.defaultWarehouseId) setDefaultWarehouseId(context.defaultWarehouseId);
        const data = await getProductsUseCase.execute(context.companyId);
        setProducts(data);
      }
    } catch (err) {
      console.error('Error cargando catálogo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [getProductsUseCase]);

  const handleCreateProduct = async (
    formData: Parameters<typeof createProductUseCase.execute>[0]
  ) => {
    if (!companyId) throw new Error('No se encontró empresa activa.');
    await createProductUseCase.execute({
      ...formData,
      companyId,
    });
    await loadData();
  };

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        prod.name.toLowerCase().includes(query) ||
        prod.sku.toLowerCase().includes(query) ||
        (prod.barcode && prod.barcode.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      const isOut = prod.availableStock <= 0;
      const isLow = prod.availableStock <= prod.minStockAlert && !isOut;

      if (stockFilter === 'OUT') return isOut;
      if (stockFilter === 'LOW') return isLow;
      if (stockFilter === 'NORMAL') return !isOut && !isLow;
      return true;
    });
  }, [products, searchTerm, stockFilter]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Catálogo de Productos"
        icon={<Package className="w-3.5 h-3.5" />}
      />

      {/* Filtros y Acción de Alta */}
      <ProductFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        stockFilter={stockFilter}
        onFilterChange={setStockFilter}
        onOpenCreateModal={() => setIsModalOpen(true)}
        onOpenPriceList={() => setIsPriceListOpen(true)}
        onOpenImportModal={() => setIsImportOpen(true)}
        onOpenLabels={() => setIsLabelsOpen(true)}
        onOpenBulkPriceUpdate={() => setIsBulkUpdateOpen(true)}
        onOpenCostComparison={() => setIsCostComparisonOpen(true)}
      />

      {/* Tabla de Productos */}
      <ProductTable
        products={filteredProducts}
        loading={loading}
        onOpenLots={(prod) => setSelectedProductForLots(prod)}
      />

      {/* Modal de Alta de Producto */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateProduct as any}
      />

      {/* Modal de Lista de Precios A4 */}
      <PriceListModal
        isOpen={isPriceListOpen}
        onClose={() => setIsPriceListOpen(false)}
        products={products}
        companyName={companyName}
      />

      {/* Modal de Importación Masiva CSV */}
      <ProductImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        companyId={companyId}
        defaultWarehouseId={defaultWarehouseId}
        onImportComplete={loadData}
      />

      {/* Modal de Generador de Etiquetas A4 */}
      <LabelGeneratorModal
        isOpen={isLabelsOpen}
        onClose={() => setIsLabelsOpen(false)}
        products={products}
        companyName={companyName}
      />

      {/* Modal de Control de Lotes y Vencimientos */}
      {selectedProductForLots && (
        <LotManagementModal
          isOpen={!!selectedProductForLots}
          onClose={() => setSelectedProductForLots(null)}
          productId={selectedProductForLots.id}
          productName={selectedProductForLots.name}
          productSku={selectedProductForLots.sku}
        />
      )}

      {/* Modal de Actualizador Masivo de Precios */}
      <BulkPriceUpdateModal
        isOpen={isBulkUpdateOpen}
        onClose={() => setIsBulkUpdateOpen(false)}
        products={products}
        companyId={companyId}
        onUpdateComplete={loadData}
      />

      {/* Modal de Comparativa de Costos por Proveedor */}
      <SupplierCostComparisonModal
        isOpen={isCostComparisonOpen}
        onClose={() => setIsCostComparisonOpen(false)}
        products={products}
        companyId={companyId}
      />
    </div>
  );
}
