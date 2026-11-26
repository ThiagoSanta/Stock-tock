import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Boxes,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface ParsedProductRow {
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  minStockAlert: number;
  initialStock: number;
  barcode?: string;
  isValid: boolean;
  errors: string[];
}

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  defaultWarehouseId: string;
  onImportComplete: () => void;
}

export function ProductImportModal({
  isOpen,
  onClose,
  companyId,
  defaultWarehouseId,
  onImportComplete,
}: ProductImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resultSummary, setResultSummary] = useState<{
    inserted: number;
    initialStockCount: number;
  } | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Descargar plantilla modelo
  const handleDownloadTemplate = () => {
    const csvContent =
      'sku,nombre,categoria,unidad,costo_ppp,precio_venta,stock_minimo,stock_inicial,codigo_barras\n' +
      'TAL-PER-750,Taladro Percutor 750W,Herramientas,UNIDAD,45000,78500,5,15,7791234567890\n' +
      'DIS-COR-115,Disco de Corte 115mm Fino,Abrasivos,UNIDAD,650,1400,20,100,7791234567891\n' +
      'PIN-LAT-020,Pintura Látex Interior 20L,Pinturería,UNIDAD,32000,58000,2,8,7791234567892';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_productos_stocktock.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Procesar archivo CSV
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setGeneralError(null);
    setResultSummary(null);

    try {
      const text = await selectedFile.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');

      if (lines.length < 2) {
        throw new Error('El archivo CSV está vacío o solo contiene la cabecera.');
      }

      // Detectar delimitador (, o ;)
      const headerLine = lines[0];
      const delimiter = headerLine.includes(';') ? ';' : ',';

      const headers = headerLine.split(delimiter).map((h) => h.trim().toLowerCase());
      const skuIdx = headers.findIndex((h) => h === 'sku' || h === 'codigo');
      const nameIdx = headers.findIndex((h) => h === 'nombre' || h === 'producto' || h === 'descripcion');
      const catIdx = headers.findIndex((h) => h === 'categoria' || h === 'rubro');
      const unitIdx = headers.findIndex((h) => h === 'unidad' || h === 'medida');
      const costIdx = headers.findIndex((h) => h === 'costo_ppp' || h === 'costo' || h === 'cost');
      const priceIdx = headers.findIndex((h) => h === 'precio_venta' || h === 'precio' || h === 'price');
      const minStockIdx = headers.findIndex((h) => h === 'stock_minimo' || h === 'minimo');
      const initStockIdx = headers.findIndex((h) => h === 'stock_inicial' || h === 'stock' || h === 'cantidad');
      const barcodeIdx = headers.findIndex((h) => h === 'codigo_barras' || h === 'barcode' || h === 'ean');

      if (skuIdx === -1 || nameIdx === -1 || priceIdx === -1) {
        throw new Error(
          'El archivo debe contener al menos las columnas: "sku", "nombre" y "precio_venta".'
        );
      }

      const parsedRows: ParsedProductRow[] = [];
      const seenSkus = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const rawLine = lines[i];
        if (!rawLine.trim()) continue;

        const cols = rawLine.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
        const errors: string[] = [];

        const sku = cols[skuIdx] || '';
        const name = cols[nameIdx] || '';
        const category = catIdx !== -1 ? cols[catIdx] || 'General' : 'General';
        const unit = unitIdx !== -1 ? cols[unitIdx] || 'UNIDAD' : 'UNIDAD';
        const costPrice = costIdx !== -1 ? parseFloat(cols[costIdx]?.replace(',', '.') || '0') || 0 : 0;
        const salePrice = parseFloat(cols[priceIdx]?.replace(',', '.') || '0');
        const minStockAlert = minStockIdx !== -1 ? parseFloat(cols[minStockIdx]?.replace(',', '.') || '0') || 0 : 0;
        const initialStock = initStockIdx !== -1 ? parseFloat(cols[initStockIdx]?.replace(',', '.') || '0') || 0 : 0;
        const barcode = barcodeIdx !== -1 ? cols[barcodeIdx] || undefined : undefined;

        if (!sku) errors.push('Falta SKU');
        if (sku && seenSkus.has(sku.toLowerCase())) {
          errors.push('SKU duplicado en el archivo');
        } else if (sku) {
          seenSkus.add(sku.toLowerCase());
        }

        if (!name) errors.push('Falta Nombre');
        if (isNaN(salePrice) || salePrice <= 0) errors.push('Precio de venta inválido');

        parsedRows.push({
          sku,
          name,
          category,
          unit,
          costPrice,
          salePrice: isNaN(salePrice) ? 0 : salePrice,
          minStockAlert,
          initialStock,
          barcode,
          isValid: errors.length === 0,
          errors,
        });
      }

      setRows(parsedRows);
    } catch (err: any) {
      setGeneralError(err?.message || 'Error al procesar el archivo CSV.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar importación masiva en Supabase
  const handleExecuteImport = async () => {
    const validRows = rows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setImporting(true);
    setGeneralError(null);

    try {
      const supabase = createClient();

      // 1. Resolver o crear categorías
      const uniqueCategoryNames = Array.from(new Set(validRows.map((r) => r.category.trim()))).filter(Boolean);
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('company_id', companyId);

      const categoryMap = new Map<string, string>();
      (existingCategories || []).forEach((c) => {
        categoryMap.set(c.name.toLowerCase(), c.id);
      });

      for (const catName of uniqueCategoryNames) {
        if (!categoryMap.has(catName.toLowerCase())) {
          const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const { data: newCat, error: catErr } = await supabase
            .from('categories')
            .insert({
              company_id: companyId,
              name: catName,
              slug: slug || 'cat-' + Date.now(),
            })
            .select('id, name')
            .single();

          if (!catErr && newCat) {
            categoryMap.set(newCat.name.toLowerCase(), newCat.id);
          }
        }
      }

      // 2. Insertar productos en Supabase
      let initialStockCounter = 0;

      for (const row of validRows) {
        const catId = categoryMap.get(row.category.toLowerCase()) || null;

        // Upsert producto por SKU
        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .upsert(
            {
              company_id: companyId,
              category_id: catId,
              sku: row.sku,
              name: row.name,
              barcode: row.barcode || null,
              unit_of_measure: row.unit || 'UNIDAD',
              cost_price: row.costPrice,
              sale_price: row.salePrice,
              min_stock_alert: row.minStockAlert,
              active: true,
            },
            { onConflict: 'company_id,sku' }
          )
          .select('id')
          .single();

        if (prodErr || !prodData) {
          console.error(`Error importando producto ${row.sku}:`, prodErr);
          continue;
        }

        // 3. Asentar stock inicial si corresponde
        if (row.initialStock > 0 && defaultWarehouseId) {
          initialStockCounter++;

          // Upsert en inventory_stock
          await supabase.from('inventory_stock').upsert(
            {
              company_id: companyId,
              warehouse_id: defaultWarehouseId,
              product_id: prodData.id,
              physical_stock: row.initialStock,
              reserved_stock: 0,
            },
            { onConflict: 'company_id,warehouse_id,product_id' }
          );

          // Asentar movimiento inicial en Kardex
          await supabase.from('stock_movements').insert({
            company_id: companyId,
            warehouse_id: defaultWarehouseId,
            product_id: prodData.id,
            movement_type: 'INGRESO_AJUSTE',
            quantity: row.initialStock,
            balance_physical_after: row.initialStock,
            balance_reserved_after: 0,
            balance_available_after: row.initialStock,
            unit_cost: row.costPrice,
            reference_type: 'INVENTORY_IMPORT',
            notes: 'Carga masiva de stock inicial desde planilla CSV',
          });
        }
      }

      setResultSummary({
        inserted: validRows.length,
        initialStockCount: initialStockCounter,
      });

      onImportComplete();
    } catch (err: any) {
      setGeneralError(err?.message || 'Error durante la importación masiva.');
    } finally {
      setImporting(false);
    }
  };

  const validCount = rows.filter((r) => r.isValid).length;
  const invalidCount = rows.filter((r) => !r.isValid).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera modal */}
        <div className="h-13 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 id="import-modal-title" className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Importación Masiva de Productos (CSV)
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                Carga catálogo completo, precios y existencias iniciales
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="h-7 px-3 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-800"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Bajar Plantilla CSV</span>
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

        {/* Cuerpo del modal */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Zona de carga de archivo */}
          {!resultSummary && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100/70 p-6 rounded-xl text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileSpreadsheet className="w-8 h-8 text-zinc-400 dark:text-zinc-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {file ? file.name : 'Haz clic o arrastra aquí tu archivo CSV'}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Acepta archivos delimitados por coma o punto y coma con columnas: sku, nombre, precio_venta, etc.
              </p>
            </div>
          )}

          {/* Errores generales */}
          {generalError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Resultado exitoso */}
          {resultSummary && (
            <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                ¡Importación completada con éxito!
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-md mx-auto">
                Se dieron de alta / actualizaron <strong>{resultSummary.inserted} productos</strong> en el catálogo y se crearon los registros de stock y Kardex para <strong>{resultSummary.initialStockCount} artículos</strong> con existencias iniciales.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Listo, ver catálogo actualizado
              </button>
            </div>
          )}

          {/* Grilla de previsualización */}
          {!resultSummary && rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Previsualización: {rows.length} filas
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold">
                    ✓ {validCount} listas para importar
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-semibold">
                      ✕ {invalidCount} con errores
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-100 dark:bg-zinc-800 sticky top-0 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold text-[11px]">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">Estado</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3">Nombre</th>
                      <th className="py-2 px-3">Categoría</th>
                      <th className="py-2 px-3 text-right">Precio Venta</th>
                      <th className="py-2 px-3 text-right">Stock Inicial</th>
                      <th className="py-2 px-3">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {rows.map((r, i) => (
                      <tr
                        key={i}
                        className={r.isValid ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60' : 'bg-rose-50/40 hover:bg-rose-50/70'}
                      >
                        <td className="py-2 px-3 text-center">
                          {r.isValid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mx-auto" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 mx-auto" />
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-medium text-zinc-700 dark:text-zinc-300">{r.sku || '-'}</td>
                        <td className="py-2 px-3 font-semibold text-zinc-900 dark:text-zinc-100">{r.name || '-'}</td>
                        <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">{r.category}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          ${r.salePrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-zinc-700 dark:text-zinc-300">
                          {r.initialStock > 0 ? r.initialStock : '-'}
                        </td>
                        <td className="py-2 px-3 text-[11px]">
                          {r.isValid ? (
                            <span className="text-zinc-400 dark:text-zinc-500">Correcto</span>
                          ) : (
                            <span className="text-rose-600 font-medium">{r.errors.join(', ')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botón de acción */}
        {!resultSummary && (
          <div className="h-12 px-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {validCount > 0 ? `${validCount} productos válidos serán procesados` : 'Selecciona un archivo CSV'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={importing}
                className="h-8 px-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={validCount === 0 || importing}
                className="h-8 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{importing ? 'Importando...' : `Confirmar e Importar (${validCount})`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
