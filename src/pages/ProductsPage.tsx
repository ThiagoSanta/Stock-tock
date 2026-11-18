import React, { useEffect, useState, useMemo } from 'react';
import { Package, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';
import { SupabaseProductRepository } from '@/core/infrastructure/repositories/SupabaseProductRepository';
import { CreateProductUseCase } from '@/core/application/use-cases/catalog/CreateProductUseCase';
import { GetProductsWithStockUseCase } from '@/core/application/use-cases/catalog/GetProductsWithStockUseCase';
import { ProductFilters } from '@/presentation/modules/catalog/ProductFilters';
import { ProductTable } from '@/presentation/modules/catalog/ProductTable';
import { ProductModal } from '@/presentation/modules/catalog/ProductModal';
import { createClient } from '@/utils/supabase/client';

export function ProductsPage() {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'NORMAL' | 'LOW' | 'OUT'>('ALL');

  const repo = useMemo(() => new SupabaseProductRepository(), []);
  const getProductsUseCase = useMemo(() => new GetProductsWithStockUseCase(repo), [repo]);
  const createProductUseCase = useMemo(() => new CreateProductUseCase(repo), [repo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: companies } = await supabase.from('companies').select('id').limit(1);

      if (companies && companies.length > 0) {
        const cId = companies[0].id;
        setCompanyId(cId);
        const data = await getProductsUseCase.execute(cId);
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
              <Package className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Catálogo de Productos
            </h1>
          </div>
        </div>
      </div>

      {/* Filtros y Acción de Alta */}
      <ProductFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        stockFilter={stockFilter}
        onFilterChange={setStockFilter}
        onOpenCreateModal={() => setIsModalOpen(true)}
      />

      {/* Tabla de Productos */}
      <ProductTable products={filteredProducts} loading={loading} />

      {/* Modal de Alta de Producto */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateProduct as any}
      />
    </div>
  );
}
