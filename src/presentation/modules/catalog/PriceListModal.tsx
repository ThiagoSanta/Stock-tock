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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera modal y barra de filtros (Oculto en impresión) */}
        <div className="border-b border-slate-200 bg-slate-50/90 print:hidden shrink-0">
          <div className="h-13 px-4 flex items-center justify-between border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 id="price-list-modal-title" className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Generador de Lista de Precios A4
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {filteredProducts.length} productos listados
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="h-7 px-3.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Lista A4</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Opciones de filtrado rápido */}
          <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs bg-white">
            <div className="flex items-center gap-2">
              <label htmlFor="cat-filter" className="text-slate-600 font-medium text-[11px] flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-400" /> Categoría:
              </label>
              <select
                id="cat-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-7 px-2 rounded border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:outline-none"
              >
                <option value="ALL">Todas las categorías ({products.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                />
                <span>Solo con stock disponible</span>
              </label>

              <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBarcode}
                  onChange={(e) => setShowBarcode(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                />
                <span>Mostrar código de barras / EAN</span>
              </label>
            </div>
          </div>
        </div>

        {/* Hoja imprimible A4 */}
        <div id="printable-a4-voucher" className="p-8 overflow-y-auto font-sans text-slate-900">
          {/* Encabezado A4 de la empresa */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-800" />
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                  {companyName}
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Lista Oficial de Precios de Venta al Público
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                Lista de Precios
              </span>
              <p className="text-[11px] font-mono text-slate-600 mt-1 flex items-center justify-end gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Vigencia: {currentDate}</span>
              </p>
            </div>
          </div>

          {/* Tablas por categoría */}
          {groupedProducts.size === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No hay productos que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(groupedProducts.entries()).map(([catName, items]) => (
                <div key={catName} className="space-y-1.5 break-inside-avoid">
                  {/* Encabezado de Categoría */}
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-300">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {catName}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono ml-auto">
                      ({items.length} {items.length === 1 ? 'ítem' : 'ítems'})
                    </span>
                  </div>

                  {/* Tabla de Artículos */}
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                        <th className="py-1.5 px-2 w-28">Código / SKU</th>
                        <th className="py-1.5 px-2">Descripción del Producto</th>
                        {showBarcode && <th className="py-1.5 px-2 w-32 font-mono">Cód. Barras</th>}
                        <th className="py-1.5 px-2 w-20 text-center">Unidad</th>
                        <th className="py-1.5 px-2 w-28 text-right">Precio Venta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-50/50">
                          <td className="py-1.5 px-2 font-mono font-medium text-slate-600 text-[11px]">
                            {prod.sku}
                          </td>
                          <td className="py-1.5 px-2 font-semibold text-slate-900">
                            {prod.name}
                          </td>
                          {showBarcode && (
                            <td className="py-1.5 px-2 font-mono text-slate-500 text-[11px]">
                              {prod.barcode || '-'}
                            </td>
                          )}
                          <td className="py-1.5 px-2 text-center text-slate-500 text-[11px]">
                            {prod.unitOfMeasure || 'UNIDAD'}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950 text-xs">
                            ${prod.salePrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
          <div className="mt-10 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-2">
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
