import React, { useState, useMemo } from 'react';
import { X, Percent, ArrowRight, AlertCircle, CheckCircle2, RefreshCw, Calculator } from 'lucide-react';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';
import { createClient } from '@/utils/supabase/client';
import { AuditService } from '@/core/application/services/AuditService';
import { useUserRole } from '@/utils/security/UserRoleContext';

interface BulkPriceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductWithStock[];
  companyId: string;
  onUpdateComplete: () => Promise<void>;
}

type UpdateTarget = 'SALE_PRICE_PERCENT' | 'ALL_PRICES_PERCENT' | 'COST_PRICE_PERCENT' | 'MARKUP_ON_COST';
type RoundingMode = 'NONE' | 'INTEGER' | 'DECADE' | 'HUNDRED' | 'PSYCHOLOGICAL_90' | 'PSYCHOLOGICAL_99';

export function BulkPriceUpdateModal({
  isOpen,
  onClose,
  products,
  companyId,
  onUpdateComplete,
}: BulkPriceUpdateModalProps) {
  const [target, setTarget] = useState<UpdateTarget>('SALE_PRICE_PERCENT');
  const [percentage, setPercentage] = useState('15');
  const [rounding, setRounding] = useState<RoundingMode>('INTEGER');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const numPercent = parseFloat(percentage) || 0;
  const { currentUser } = useUserRole();

  const roundPrice = (val: number, mode: RoundingMode): number => {
    if (val <= 0) return 0;
    switch (mode) {
      case 'INTEGER':
        return Math.round(val);
      case 'DECADE':
        return Math.round(val / 10) * 10;
      case 'HUNDRED':
        return Math.round(val / 100) * 100;
      case 'PSYCHOLOGICAL_90':
        return Math.floor(val) + 0.90;
      case 'PSYCHOLOGICAL_99':
        return Math.floor(val) + 0.99;
      case 'NONE':
      default:
        return Math.round(val * 100) / 100;
    }
  };

  // Calcular nuevos precios
  const previewList = useMemo(() => {
    return products.map((p) => {
      let newSalePrice = p.salePrice;
      let newCostPrice = p.costPrice;

      if (target === 'SALE_PRICE_PERCENT' || target === 'ALL_PRICES_PERCENT') {
        const factor = 1 + numPercent / 100;
        newSalePrice = roundPrice(p.salePrice * factor, rounding);
      } else if (target === 'COST_PRICE_PERCENT') {
        const factor = 1 + numPercent / 100;
        newCostPrice = roundPrice(p.costPrice * factor, rounding);
      } else if (target === 'MARKUP_ON_COST') {
        // Precio = Costo * (1 + % / 100)
        const factor = 1 + numPercent / 100;
        newSalePrice = roundPrice(p.costPrice * factor, rounding);
      }

      const newWholesalePrice = p.wholesalePrice ? roundPrice(p.wholesalePrice * (1 + numPercent / 100), rounding) : undefined;
      const newSpecialPrice = p.specialPrice ? roundPrice(p.specialPrice * (1 + numPercent / 100), rounding) : undefined;

      const diffSale = newSalePrice - p.salePrice;
      const diffCost = newCostPrice - p.costPrice;

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        oldSalePrice: p.salePrice,
        newSalePrice,
        newWholesalePrice,
        newSpecialPrice,
        diffSale,
        oldCostPrice: p.costPrice,
        newCostPrice,
        diffCost,
      };
    });
  }, [products, target, numPercent, rounding]);

  if (!isOpen) return null;

  const handleApplyUpdate = async () => {
    if (products.length === 0) return;
    if (isNaN(numPercent) || numPercent === 0) {
      setError('Ingresá un porcentaje distinto de cero.');
      return;
    }

    const confirmMsg = `¿Confirmás la actualización masiva de precios para ${products.length} productos con un ajuste de ${numPercent > 0 ? '+' : ''}${numPercent}%?`;
    if (!window.confirm(confirmMsg)) return;

    setUpdating(true);
    setError(null);
    setSuccessCount(null);

    try {
      const supabase = createClient();

      // Actualizar en lotes de 20 para confiabilidad
      let count = 0;
      for (const item of previewList) {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        if (target === 'SALE_PRICE_PERCENT' || target === 'MARKUP_ON_COST') {
          updatePayload.sale_price = item.newSalePrice;
        } else if (target === 'ALL_PRICES_PERCENT') {
          updatePayload.sale_price = item.newSalePrice;
          if (item.newWholesalePrice !== undefined) updatePayload.wholesale_price = item.newWholesalePrice;
          if (item.newSpecialPrice !== undefined) updatePayload.special_price = item.newSpecialPrice;
        }
        if (target === 'COST_PRICE_PERCENT') {
          updatePayload.cost_price = item.newCostPrice;
        }

        const { error: err } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', item.id)
          .eq('company_id', companyId);

        if (err) throw err;
        count++;
      }

      setSuccessCount(count);
      await onUpdateComplete();
      // Audit log — no bloqueante
      AuditService.logAction({
        companyId,
        userName: currentUser.name,
        userRole: currentUser.role,
        module: 'CATALOGO',
        action: 'ACTUALIZACION_MASIVA_PRECIOS',
        details: `${count} producto(s) actualizados, ajuste ${numPercent > 0 ? '+' : ''}${numPercent}% (${target})`,
      }).catch(() => {});
    } catch (err: any) {
      console.error('Error actualizando precios:', err);
      setError(err?.message || 'Error durante la actualización masiva.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center">
              <Percent className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Actualizador Masivo de Precios
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 space-y-3 shrink-0">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>¡Se actualizaron con éxito los precios de {successCount} productos!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Modalidad */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                ¿Qué querés actualizar?
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as UpdateTarget)}
                className="w-full h-8 px-2 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
              >
                <option value="SALE_PRICE_PERCENT">Precio de Venta Minorista (+ / - %)</option>
                <option value="ALL_PRICES_PERCENT">Todas las Listas (Minorista + Mayorista + Gremio) (+ / - %)</option>
                <option value="COST_PRICE_PERCENT">Costo de Reposición (+ / - %)</option>
                <option value="MARKUP_ON_COST">Margen sobre Costo (%)</option>
              </select>
            </div>

            {/* Porcentaje */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Porcentaje (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  placeholder="Ej: 15"
                  className="w-full h-8 pl-3 pr-7 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 dark:text-zinc-500">
                  %
                </span>
              </div>
            </div>

            {/* Redondeo */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Criterio de Redondeo
              </label>
              <select
                value={rounding}
                onChange={(e) => setRounding(e.target.value as RoundingMode)}
                className="w-full h-8 px-2 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
              >
                <option value="INTEGER">Al entero más cercano ($1)</option>
                <option value="DECADE">A decenas ($10)</option>
                <option value="HUNDRED">A centenas ($100)</option>
                <option value="PSYCHOLOGICAL_90">Psicológico (.90)</option>
                <option value="PSYCHOLOGICAL_99">Psicológico (.99)</option>
                <option value="NONE">Sin redondeo (con centavos)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preview Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium pb-1">
            <span>Previsualización de Cambios ({products.length} productos)</span>
            <span className="font-mono text-[11px]">
              Ajuste aplicado: <strong className="text-zinc-900 dark:text-zinc-100">{numPercent > 0 ? `+${numPercent}%` : `${numPercent}%`}</strong>
            </span>
          </div>

          <div className="rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 uppercase text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                <tr>
                  <th className="py-2 px-3">Producto / SKU</th>
                  <th className="py-2 px-3 text-right">Precio Actual</th>
                  <th className="py-2 px-3 text-center">→</th>
                  <th className="py-2 px-3 text-right">Nuevo Precio</th>
                  <th className="py-2 px-3 text-right">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {previewList.slice(0, 15).map((item) => {
                  const isSaleTarget = target === 'SALE_PRICE_PERCENT' || target === 'MARKUP_ON_COST';
                  const currentVal = isSaleTarget ? item.oldSalePrice : item.oldCostPrice;
                  const newVal = isSaleTarget ? item.newSalePrice : item.newCostPrice;
                  const diffVal = isSaleTarget ? item.diffSale : item.diffCost;

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                      <td className="py-2 px-3">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 block truncate max-w-xs">{item.name}</span>
                        <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{item.sku}</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                        ${currentVal.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center text-zinc-400 dark:text-zinc-500">→</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        ${newVal.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">
                        <span className={diffVal >= 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}>
                          {diffVal >= 0 ? `+$${diffVal.toFixed(2)}` : `-$${Math.abs(diffVal).toFixed(2)}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {products.length > 15 && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center pt-1">
              Mostrando los primeros 15 de {products.length} productos afectados.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 px-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 shrink-0">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Esta acción modificará la base de datos de productos de forma irreversible.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={updating}
              className="h-8 px-3 rounded border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplyUpdate}
              disabled={updating || products.length === 0}
              className="h-8 px-4 rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {updating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Aplicando en BD...</span>
                </>
              ) : (
                <span>Aplicar a {products.length} Productos</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
