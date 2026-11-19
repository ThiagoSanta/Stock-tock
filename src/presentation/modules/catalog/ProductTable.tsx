import React from 'react';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';
import { AlertTriangle, CheckCircle, PackageX, MapPin, Layers } from 'lucide-react';

interface ProductTableProps {
  products: ProductWithStock[];
  loading: boolean;
  onOpenLots?: (product: ProductWithStock) => void;
}

export function ProductTable({ products, loading, onOpenLots }: ProductTableProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs"
      >
        <div
          aria-hidden="true"
          className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"
        />
        <p className="text-xs font-medium text-slate-600">Cargando catálogo de productos...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
        <PackageX className="w-6 h-6 text-slate-400 mx-auto mb-2" aria-hidden="true" />
        <h4 className="text-xs font-bold text-slate-900">No se encontraron productos</h4>
        <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
          No hay artículos que coincidan con la búsqueda o el filtro aplicado.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Listado completo de productos en catálogo y sus stocks</caption>
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th scope="col" className="py-3 px-3">Producto & SKU</th>
              <th scope="col" className="py-3 px-3">Ubicación</th>
              <th scope="col" className="py-3 px-3">Unidad</th>
              <th scope="col" className="py-3 px-3 text-right">Costo PPP</th>
              <th scope="col" className="py-3 px-3 text-right">Precio Venta</th>
              <th scope="col" className="py-3 px-3 text-center">Físico</th>
              <th scope="col" className="py-3 px-3 text-center">Reservado</th>
              <th scope="col" className="py-3 px-3 text-center">Disponible</th>
              <th scope="col" className="py-3 px-3 text-center">Mínimo</th>
              <th scope="col" className="py-3 px-3 text-center">Estado</th>
              <th scope="col" className="py-3 px-3 text-center">Lotes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((item) => {
              const isOutOfStock = item.availableStock <= 0;
              const isLowStock = item.availableStock <= item.minStockAlert && !isOutOfStock;

              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-900 block">{item.name}</span>
                    <span className="text-xs font-mono text-slate-600">
                      SKU: {item.sku}
                      {item.barcode && ` • ${item.barcode}`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 text-xs">
                    {item.storageLocation ? (
                      <span className="inline-flex items-center gap-1 text-slate-800 font-medium">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        {item.storageLocation}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-mono text-xs">
                    {item.unitOfMeasure}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                    ${item.costPrice.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    <span className="font-bold text-slate-900 block">${item.salePrice.toFixed(2)}</span>
                    {(item.wholesalePrice || item.specialPrice) ? (
                      <div className="text-[10px] text-slate-500 space-y-0.5 mt-0.5">
                        {item.wholesalePrice ? <div>May: ${item.wholesalePrice.toFixed(2)}</div> : null}
                        {item.specialPrice ? <div>Grem: ${item.specialPrice.toFixed(2)}</div> : null}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-800 tabular-nums font-medium">
                    {item.physicalStock}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-600 tabular-nums">
                    {item.reservedStock}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 tabular-nums">
                    {item.availableStock}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-500 tabular-nums">
                    {item.minStockAlert ? `${item.minStockAlert} un.` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                        isOutOfStock
                          ? 'bg-rose-50 text-rose-900 border-rose-300'
                          : isLowStock
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      {isOutOfStock ? (
                        <>
                          <PackageX className="w-3 h-3" aria-hidden="true" /> Quiebre
                        </>
                      ) : isLowStock ? (
                        <>
                          <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Bajo Stock
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" aria-hidden="true" /> Normal
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {onOpenLots && (
                      <button
                        type="button"
                        onClick={() => onOpenLots(item)}
                        title="Gestionar lotes y vencimientos FIFO"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Layers className="w-3 h-3 text-slate-500" />
                        <span>Lotes</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
