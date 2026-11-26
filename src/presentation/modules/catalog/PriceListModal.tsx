import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Building2,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';

interface PriceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductWithStock[];
  companyName: string;
}

export function PriceListModal({
  isOpen,
  onClose,
  products,
  companyName,
}: PriceListModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [showBarcode, setShowBarcode] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<'MINORISTA' | 'MAYORISTA' | 'GREMIO'>('MINORISTA');

  const getTierPrice = (prod: ProductWithStock) => {
    if (selectedTier === 'MAYORISTA' && prod.wholesalePrice && prod.wholesalePrice > 0) {
      return prod.wholesalePrice;
    }
    if (selectedTier === 'GREMIO' && prod.specialPrice && prod.specialPrice > 0) {
      return prod.specialPrice;
    }
    return prod.salePrice;
  };

  // Categorías únicas
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      set.add(p.categoryName || 'General / Sin Categoría');
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const cat = p.categoryName || 'General / Sin Categoría';
      if (selectedCategory !== 'ALL' && cat !== selectedCategory) return false;
      if (onlyInStock && p.availableStock <= 0) return false;
      return true;
    });
  }, [products, selectedCategory, onlyInStock]);

  // Agrupado por categoría para impresión ordenada
  const groupedProducts = useMemo(() => {
    const map = new Map<string, ProductWithStock[]>();
    filteredProducts.forEach((p) => {
      const cat = p.categoryName || 'General / Sin Categoría';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    });

    // Ordenar productos dentro de cada categoría alfabéticamente
    map.forEach((list) => {
      list.sort((a, b) => a.name.localeCompare(b.name));
    });

    return map;
  }, [filteredProducts]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-list-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera modal y barra de filtros (Oculto en impresión) */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 print:hidden shrink-0">
          <div className="h-13 px-4 flex items-center justify-between border-b border-zinc-200/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 id="price-list-modal-title" className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Generador de Lista de Precios A4
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                  {filteredProducts.length} productos listados
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="h-7 px-3.5 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Lista A4</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/80 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Opciones de filtrado rápido */}
          <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs bg-white dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedTier('MINORISTA')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedTier === 'MINORISTA'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  Minorista
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTier('MAYORISTA')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedTier === 'MAYORISTA'
                      ? 'bg-white dark:bg-zinc-900 text-sky-800 dark:text-sky-300 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  Mayorista
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTier('GREMIO')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedTier === 'GREMIO'
                      ? 'bg-white dark:bg-zinc-900 text-sky-800 dark:text-sky-300 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  Gremio
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="cat-filter" className="text-zinc-600 dark:text-zinc-400 font-medium text-[11px] flex items-center gap-1">
                  <Filter className="w-3 h-3 text-zinc-400 dark:text-zinc-500" /> Categoría:
                </label>
                <select
                  id="cat-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-7 px-2 rounded border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-950 focus:outline-none"
                >
                  <option value="ALL">Todas las categorías ({products.length})</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-[11px] text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-0 cursor-pointer"
                />
                <span>Solo con stock disponible</span>
              </label>

              <label className="flex items-center gap-1.5 text-[11px] text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBarcode}
                  onChange={(e) => setShowBarcode(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-0 cursor-pointer"
                />
                <span>Mostrar código de barras / EAN</span>
              </label>
            </div>
          </div>
        </div>

        {/* Hoja imprimible A4 */}
        <div id="printable-a4-voucher" className="p-8 overflow-y-auto font-sans text-zinc-900 dark:text-zinc-100">
          {/* Encabezado A4 de la empresa */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-zinc-900 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                  {companyName}
                </h2>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                {selectedTier === 'MAYORISTA'
                  ? 'Lista Oficial de Precios: Mayorista / Distribuidores'
                  : selectedTier === 'GREMIO'
                  ? 'Lista Oficial de Precios: Gremio / Técnicos Especiales'
                  : 'Lista Oficial de Precios de Venta al Público (Minorista)'}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-800">
                Lista {selectedTier}
              </span>
              <p className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 mt-1 flex items-center justify-end gap-1">
                <Calendar className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                <span>Vigencia: {currentDate}</span>
              </p>
            </div>
          </div>

          {/* Tablas por categoría */}
          {groupedProducts.size === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-400 dark:text-zinc-500">
              No hay productos que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(groupedProducts.entries()).map(([catName, items]) => (
                <div key={catName} className="space-y-1.5 break-inside-avoid">
                  {/* Encabezado de Categoría */}
                  <div className="flex items-center gap-1.5 pb-1 border-b border-zinc-300 dark:border-zinc-700">
                    <Layers className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      {catName}
                    </h3>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono ml-auto">
                      ({items.length} {items.length === 1 ? 'ítem' : 'ítems'})
                    </span>
                  </div>

                  {/* Tabla de Artículos */}
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold text-[10px] uppercase">
                        <th className="py-1.5 px-2 w-28">Código / SKU</th>
                        <th className="py-1.5 px-2">Descripción del Producto</th>
                        {showBarcode && <th className="py-1.5 px-2 w-32 font-mono">Cód. Barras</th>}
                        <th className="py-1.5 px-2 w-20 text-center">Unidad</th>
                        <th className="py-1.5 px-2 w-28 text-right">Precio Venta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {items.map((prod) => (
                        <tr key={prod.id} className="hover:bg-zinc-50/50">
                          <td className="py-1.5 px-2 font-mono font-medium text-zinc-600 dark:text-zinc-400 text-[11px]">
                            {prod.sku}
                          </td>
                          <td className="py-1.5 px-2 font-semibold text-zinc-900 dark:text-zinc-100">
                            {prod.name}
                          </td>
                          {showBarcode && (
                            <td className="py-1.5 px-2 font-mono text-zinc-500 dark:text-zinc-400 text-[11px]">
                              {prod.barcode || '-'}
                            </td>
                          )}
                          <td className="py-1.5 px-2 text-center text-zinc-500 dark:text-zinc-400 text-[11px]">
                            {prod.unitOfMeasure || 'UNIDAD'}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-zinc-950 text-xs">
                            ${getTierPrice(prod).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Pie de página A4 */}
          <div className="mt-10 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 gap-2">
            <p>
              Precios sujetos a modificación sin previo aviso • Expresados en moneda nacional (ARS).
            </p>
            <p className="font-mono">
              Comprobante interno • Impreso el {new Date().toLocaleString('es-AR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
