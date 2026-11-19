import React, { useState, useEffect, useMemo } from 'react';
import { X, TrendingDown, Building2, Search, CheckCircle2, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';

interface PurchaseHistoryRecord {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  unitCost: number;
  quantityOrdered: number;
  status: string;
}

interface SupplierCostComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductWithStock[];
  companyId: string;
}

export function SupplierCostComparisonModal({
  isOpen,
  onClose,
  products,
  companyId,
}: SupplierCostComparisonModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [history, setHistory] = useState<PurchaseHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');

  const supabase = useMemo(() => createClient(), []);

  // Seleccionar primer producto al abrir si no hay ninguno seleccionado
  useEffect(() => {
    if (isOpen && products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [isOpen, products, selectedProductId]);

  // Consultar compras del producto seleccionado
  useEffect(() => {
    if (!selectedProductId || !companyId || !isOpen) return;

    let isMounted = true;
    async function fetchPurchaseHistory() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('purchase_items')
          .select(`
            id,
            unit_cost,
            quantity_ordered,
            purchases (
              id,
              purchase_number,
              created_at,
              status,
              supplier_id,
              suppliers (id, name)
            )
          `)
          .eq('product_id', selectedProductId)
          .order('id', { ascending: false });

        if (error) throw error;

        const records: PurchaseHistoryRecord[] = (data || [])
          .filter((row: any) => row.purchases)
          .map((row: any) => ({
            id: row.id,
            purchaseNumber: row.purchases.purchase_number || `COM-${row.purchases.id.slice(0, 6)}`,
            supplierId: row.purchases.supplier_id,
            supplierName: row.purchases.suppliers?.name || 'Proveedor General',
            purchaseDate: row.purchases.created_at,
            unitCost: Number(row.unit_cost || 0),
            quantityOrdered: Number(row.quantity_ordered || 0),
            status: row.purchases.status,
          }));

        // Ordenar por fecha descendente
        records.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

        if (isMounted) {
          setHistory(records);
        }
      } catch (err) {
        console.error('Error cargando historial de compras del producto:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPurchaseHistory();

    return () => {
      isMounted = false;
    };
  }, [selectedProductId, companyId, isOpen]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Agrupar por proveedor para obtener el último costo de cada uno
  const supplierSummary = useMemo(() => {
    const map = new Map<string, {
      supplierName: string;
      latestCost: number;
      latestDate: string;
      purchasesCount: number;
      minCost: number;
      maxCost: number;
    }>();

    history.forEach((h) => {
      const existing = map.get(h.supplierId);
      if (!existing) {
        map.set(h.supplierId, {
          supplierName: h.supplierName,
          latestCost: h.unitCost,
          latestDate: h.purchaseDate,
          purchasesCount: 1,
          minCost: h.unitCost,
          maxCost: h.unitCost,
        });
      } else {
        existing.purchasesCount++;
        if (h.unitCost < existing.minCost) existing.minCost = h.unitCost;
        if (h.unitCost > existing.maxCost) existing.maxCost = h.unitCost;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.latestCost - b.latestCost);
  }, [history]);

  const lowestSupplier = supplierSummary.length > 0 ? supplierSummary[0] : null;
  const highestSupplier = supplierSummary.length > 1 ? supplierSummary[supplierSummary.length - 1] : null;

  const costSavingsPercentage =
    lowestSupplier && highestSupplier && highestSupplier.latestCost > 0
      ? (((highestSupplier.latestCost - lowestSupplier.latestCost) / highestSupplier.latestCost) * 100).toFixed(1)
      : null;

  const filteredProducts = useMemo(() => {
    const q = searchProduct.toLowerCase().trim();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, searchProduct]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-4xl max-h-[90vh] rounded-lg bg-white border border-slate-300 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Comparativa de Costos por Proveedor
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 p-1.5 rounded hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Selector de Producto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buscar Producto
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  placeholder="Filtrar por nombre o SKU..."
                  className="w-full h-8 pl-8 pr-2.5 rounded bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seleccionar Producto del Catálogo
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full h-8 px-2 rounded bg-white border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-slate-900"
              >
                {filteredProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — PPP Actual: ${p.costPrice.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Banner de Resumen de Ahorro */}
          {lowestSupplier && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Mejor Proveedor (Menor Costo)</span>
                <span className="font-bold text-emerald-950 text-sm block">{lowestSupplier.supplierName}</span>
                <span className="font-mono font-black text-emerald-800 text-base">
                  ${lowestSupplier.latestCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {highestSupplier && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded">
                  <span className="text-[10px] uppercase font-bold text-rose-700 block">Mayor Costo Registrado</span>
                  <span className="font-bold text-rose-950 text-sm block">{highestSupplier.supplierName}</span>
                  <span className="font-mono font-black text-rose-800 text-base">
                    ${highestSupplier.latestCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {costSavingsPercentage && (
                <div className="p-3 bg-slate-900 text-white rounded flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-slate-300 block">Diferencia de Precio</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {costSavingsPercentage}% de Ahorro
                  </span>
                  <span className="text-[11px] text-slate-300">Comprando al proveedor más económico</span>
                </div>
              )}
            </div>
          )}

          {/* Tabla Comparativa de Proveedores */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              Proveedores que cotizaron / abastecieron este producto
            </h4>

            {supplierSummary.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded border border-slate-200">
                No hay órdenes de compra registradas para este producto todavía.
              </div>
            ) : (
              <div className="rounded border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-700">
                    <tr>
                      <th className="py-2 px-3">Proveedor</th>
                      <th className="py-2 px-3 text-right">Último Costo</th>
                      <th className="py-2 px-3 text-right">Mínimo Histórico</th>
                      <th className="py-2 px-3 text-right">Máximo Histórico</th>
                      <th className="py-2 px-3 text-center">Compras</th>
                      <th className="py-2 px-3 text-right">Última Fecha</th>
                      <th className="py-2 px-3 text-center">Calificación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierSummary.map((s, idx) => (
                      <tr key={s.supplierName} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {s.supplierName}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ${s.latestCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          ${s.minCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          ${s.maxCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                          {s.purchasesCount}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500 font-mono text-[11px]">
                          {new Date(s.latestDate).toLocaleDateString('es-AR')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {idx === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Mejor Opción
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              Alternativa
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Historial Detallado de Compras del Artículo */}
          {history.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                Historial de Compras Inmutables ({history.length} órdenes)
              </h4>
              <div className="rounded border border-slate-200 overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-700 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">Nº Orden</th>
                      <th className="py-2 px-3">Proveedor</th>
                      <th className="py-2 px-3 text-right">Cantidad</th>
                      <th className="py-2 px-3 text-right">Costo Unit.</th>
                      <th className="py-2 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-1.5 px-3 text-slate-500 font-mono text-[11px]">
                          {new Date(h.purchaseDate).toLocaleDateString('es-AR')}
                        </td>
                        <td className="py-1.5 px-3 font-mono font-bold text-slate-900">
                          {h.purchaseNumber}
                        </td>
                        <td className="py-1.5 px-3 font-medium text-slate-800">{h.supplierName}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-700">{h.quantityOrdered} un.</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                          ${h.unitCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-11 px-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <p className="text-[11px] text-slate-500">
            Comparativa basada en las órdenes de compra reales cargadas en el sistema
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-7 px-3 rounded border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
