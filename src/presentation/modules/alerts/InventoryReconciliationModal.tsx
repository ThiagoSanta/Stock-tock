import React, { useState, useMemo } from 'react';
import {
  X,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  SlidersHorizontal,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { InventoryExportRow } from '@/core/domain/alerts/types';
import { AdjustStockUseCase } from '@/core/application/use-cases/inventory/AdjustStockUseCase';
import { SupabaseInventoryRepository } from '@/core/infrastructure/repositories/SupabaseInventoryRepository';

interface InventoryReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: InventoryExportRow[];
  companyId: string;
  warehouseId: string;
  onReconciliationComplete: () => void;
}

export function InventoryReconciliationModal({
  isOpen,
  onClose,
  products,
  companyId,
  warehouseId,
  onReconciliationComplete,
}: InventoryReconciliationModalProps) {
  // Mapa de conteos ingresados: productId -> número ingresado (o string vacío)
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [reason, setReason] = useState<string>(
    `Auditoría y conteo físico general - ${new Date().toLocaleDateString('es-AR')}`
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    appliedCount: number;
    surplusCount: number;
    deficitCount: number;
  } | null>(null);

  const inventoryRepo = useMemo(() => new SupabaseInventoryRepository(), []);
  const adjustUseCase = useMemo(() => new AdjustStockUseCase(inventoryRepo), [inventoryRepo]);

  if (!isOpen) return null;

  const handleCountChange = (productId: string, value: string) => {
    setCounts((prev) => ({
      ...prev,
      [productId]: value,
    }));
  };

  const handlePreFillWithTheoretical = () => {
    const filled: Record<string, string> = {};
    products.forEach((p) => {
      filled[p.productId] = String(p.physicalStock);
    });
    setCounts(filled);
  };

  // Cálculo de discrepancias
  const rowsWithDifferences = products.map((prod) => {
    const entered = counts[prod.productId];
    const hasValue = entered !== undefined && entered.trim() !== '';
    const counted = hasValue ? Number(entered) : prod.physicalStock;
    const diff = hasValue ? counted - prod.physicalStock : 0;
    const financialImpact = diff * (prod.costPrice || 0);

    return {
      ...prod,
      hasValue,
      counted: hasValue ? counted : null,
      diff,
      financialImpact,
      isInvalid: hasValue && (isNaN(counted) || counted < 0),
    };
  });

  const discrepancies = rowsWithDifferences.filter(
    (r) => r.hasValue && r.diff !== 0 && !r.isInvalid
  );
  const surplusRows = discrepancies.filter((r) => r.diff > 0);
  const deficitRows = discrepancies.filter((r) => r.diff < 0);
  const totalFinancialImpact = discrepancies.reduce((acc, r) => acc + r.financialImpact, 0);

  const filteredRows = rowsWithDifferences.filter((row) => {
    const matchesSearch =
      row.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.sku.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (onlyDifferences) return row.hasValue && row.diff !== 0;
    return true;
  });

  const handleApplyAdjustments = async () => {
    if (discrepancies.length === 0) {
      setErrorMessage('No hay diferencias registradas para conciliar.');
      return;
    }

    if (!reason || reason.trim().length < 5) {
      setErrorMessage('Por favor ingresá un motivo de auditoría de al menos 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let surplus = 0;
      let deficit = 0;

      for (const item of discrepancies) {
        const type = item.diff > 0 ? 'INGRESO_AJUSTE' : 'SALIDA_AJUSTE';
        const quantity = Math.abs(item.diff);

        await adjustUseCase.execute({
          companyId,
          warehouseId,
          productId: item.productId,
          type,
          quantity,
          reason: `${reason.trim()} (Diferencia de conteo: ${item.diff > 0 ? '+' : ''}${item.diff} un.)`,
        });

        if (item.diff > 0) surplus++;
        else deficit++;
      }

      setSuccessResult({
        appliedCount: discrepancies.length,
        surplusCount: surplus,
        deficitCount: deficit,
      });

      onReconciliationComplete();
    } catch (err: any) {
      console.error('Error al aplicar ajustes de conciliación:', err);
      setErrorMessage(err.message || 'Error al guardar los ajustes en el Kardex.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reconciliation-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs"
    >
      <div
        className="w-full max-w-4xl bg-white rounded-xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 id="reconciliation-title" className="text-sm font-bold text-slate-900 leading-none">
                Conciliación y Cierre de Conteo Físico
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Auditoría masiva de existencias con asiento automático en Kardex
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar conciliación"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Si ya se completó el proceso */}
        {successResult ? (
          <div className="p-8 text-center space-y-4 max-w-md mx-auto my-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ¡Inventario Conciliado Exitosamente!
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Se asentaron los movimientos auditados en el Kardex de forma inmutable.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Total de productos ajustados:</span>
                <span className="font-bold text-slate-900">{successResult.appliedCount}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Sobrantes ingresados:</span>
                <span className="font-bold">+{successResult.surplusCount}</span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>Faltantes dados de baja:</span>
                <span className="font-bold">-{successResult.deficitCount}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Cerrar y Ver Alertas Actualizadas
            </button>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Banner superior con métricas de discrepancias */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-4 gap-3 shrink-0">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Artículos Listados
                </span>
                <span className="text-base font-bold text-slate-900">{products.length}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Con Discrepancia
                </span>
                <span className="text-base font-bold text-slate-900">{discrepancies.length}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Sobrantes / Faltantes
                </span>
                <span className="text-xs font-semibold mt-1 block">
                  <span className="text-emerald-700">+{surplusRows.length} sob.</span>
                  {' • '}
                  <span className="text-rose-700">-{deficitRows.length} falt.</span>
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Impacto Monetario
                </span>
                <span
                  className={`text-sm font-bold font-mono mt-0.5 block ${
                    totalFinancialImpact >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {totalFinancialImpact >= 0 ? '+' : ''}$
                  {Math.round(totalFinancialImpact).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Opciones y Filtros */}
            <div className="p-3.5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white shrink-0">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Filtrar por nombre o SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyDifferences}
                    onChange={(e) => setOnlyDifferences(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                  />
                  <span>Mostrar solo diferencias</span>
                </label>

                <button
                  type="button"
                  onClick={handlePreFillWithTheoretical}
                  className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copia el stock teórico actual en todas las casillas para editar solo los que variaron"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Pre-llenar con stock actual</span>
                </button>
              </div>
            </div>

            {/* Tabla con scroll de artículos */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200 text-slate-700 text-[11px] uppercase font-bold z-10">
                  <tr>
                    <th className="py-2.5 px-4">Producto & SKU</th>
                    <th className="py-2.5 px-4 text-center w-28">Stock Teórico</th>
                    <th className="py-2.5 px-4 text-center w-36">Conteo Físico Real</th>
                    <th className="py-2.5 px-4 text-center w-32">Diferencia</th>
                    <th className="py-2.5 px-4 text-right w-32">Impacto ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((row) => {
                    const value = counts[row.productId] ?? '';
                    return (
                      <tr key={row.productId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4">
                          <p className="font-semibold text-slate-900">{row.productName}</p>
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                            SKU: {row.sku} • Costo: ${row.costPrice?.toLocaleString('es-AR')}
                          </p>
                        </td>

                        <td className="py-2.5 px-4 text-center font-mono font-medium text-slate-700 tabular-nums">
                          {row.physicalStock} un.
                        </td>

                        <td className="py-2 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="Sin contar"
                              value={value}
                              onChange={(e) => handleCountChange(row.productId, e.target.value)}
                              className="w-24 h-7 text-center font-mono font-bold text-xs rounded border border-slate-300 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                            />
                            <span className="text-[11px] text-slate-400">un.</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-4 text-center">
                          {!row.hasValue ? (
                            <span className="text-[11px] text-slate-400 italic">Pendiente</span>
                          ) : row.diff === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Exacto (0)
                            </span>
                          ) : row.diff > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                              <TrendingUp className="w-3 h-3 text-emerald-700" />
                              +{row.diff} un. (Sobrante)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-900 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                              <TrendingDown className="w-3 h-3 text-rose-700" />
                              {row.diff} un. (Faltante)
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-xs font-semibold">
                          {!row.hasValue || row.diff === 0 ? (
                            <span className="text-slate-400">$0</span>
                          ) : (
                            <span className={row.financialImpact > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                              {row.financialImpact > 0 ? '+' : ''}$
                              {Math.round(row.financialImpact).toLocaleString('es-AR')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer con Motivo de Auditoría y Botón de Aplicar */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 space-y-3">
              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex-1 max-w-lg">
                  <label htmlFor="audit-reason" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Motivo / Justificación General de Auditoría:
                  </label>
                  <input
                    id="audit-reason"
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej: Cierre de mes, auditoría física ciega estantería A..."
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="h-9 px-3.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyAdjustments}
                    disabled={isSubmitting || discrepancies.length === 0}
                    className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Asentando en Kardex...</span>
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="w-4 h-4" />
                        <span>Aplicar {discrepancies.length} Ajustes en Lote</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
