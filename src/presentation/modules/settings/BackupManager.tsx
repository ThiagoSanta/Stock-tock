import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface BackupManagerProps {
  companyId: string;
  companyName: string;
}

export function BackupManager({ companyId, companyName }: BackupManagerProps) {
  const [downloading, setDownloading] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

  // Estados de restauración
  const [restoring, setRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreData, setRestoreData] = useState<any | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Descarga de Backup
  const handleDownloadFullBackup = async () => {
    if (!companyId) return;
    setDownloading(true);

    try {
      const supabase = createClient();

      // Tablas principales de la empresa
      const [
        companiesRes,
        warehousesRes,
        categoriesRes,
        productsRes,
        stockRes,
        movementsRes,
        customersRes,
        suppliersRes,
        salesRes,
        purchasesRes,
        ordersRes,
        paymentsRes,
      ] = await Promise.all([
        supabase.from('companies').select('*').eq('id', companyId),
        supabase.from('warehouses').select('*').eq('company_id', companyId),
        supabase.from('categories').select('*').eq('company_id', companyId),
        supabase.from('products').select('*').eq('company_id', companyId),
        supabase.from('inventory_stock').select('*').eq('company_id', companyId),
        supabase.from('stock_movements').select('*').eq('company_id', companyId),
        supabase.from('customers').select('*').eq('company_id', companyId),
        supabase.from('suppliers').select('*').eq('company_id', companyId),
        supabase.from('sales').select('*').eq('company_id', companyId),
        supabase.from('purchases').select('*').eq('company_id', companyId),
        supabase.from('orders').select('*').eq('company_id', companyId),
        supabase.from('customer_payments').select('*').eq('company_id', companyId),
      ]);

      const productIds = (productsRes.data || []).map((p: any) => p.id);
      const saleIds = (salesRes.data || []).map((s: any) => s.id);

      // Tablas hijas filtradas
      const [variantsRes, saleItemsRes] = await Promise.all([
        productIds.length > 0
          ? supabase.from('product_variants').select('*').in('product_id', productIds)
          : Promise.resolve({ data: [] }),
        saleIds.length > 0
          ? supabase.from('sale_items').select('*').in('sale_id', saleIds)
          : Promise.resolve({ data: [] }),
      ]);

      const backupData = {
        meta: {
          system: 'Stock·tock ERP',
          version: '1.0',
          companyId,
          companyName,
          exportedAt: new Date().toISOString(),
          recordCounts: {
            products: productsRes.data?.length || 0,
            stockMovements: movementsRes.data?.length || 0,
            sales: salesRes.data?.length || 0,
            customers: customersRes.data?.length || 0,
            suppliers: suppliersRes.data?.length || 0,
            payments: paymentsRes.data?.length || 0,
          },
        },
        database: {
          companies: companiesRes.data || [],
          warehouses: warehousesRes.data || [],
          categories: categoriesRes.data || [],
          products: productsRes.data || [],
          productVariants: variantsRes.data || [],
          inventoryStock: stockRes.data || [],
          stockMovements: movementsRes.data || [],
          customers: customersRes.data || [],
          customerPayments: paymentsRes.data || [],
          suppliers: suppliersRes.data || [],
          sales: salesRes.data || [],
          saleItems: saleItemsRes.data || [],
          purchases: purchasesRes.data || [],
          orders: ordersRes.data || [],
        },
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-stocktock-${timestamp}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const nowStr = new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR');
      setLastBackupDate(nowStr);
    } catch (err) {
      console.error('Error generando backup:', err);
      alert('Error generando la copia de seguridad. Revisa la conexión.');
    } finally {
      setDownloading(false);
    }
  };

  // 2. Selección y parseo del archivo JSON para Restaurar
  const handleSelectRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    setRestoreError(null);
    setRestoreSuccess(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (!json.meta || !json.database) {
        throw new Error('El archivo no parece ser un respaldo válido de Stock·tock (faltan claves meta/database).');
      }

      setRestoreData(json);
    } catch (err: any) {
      setRestoreError(err?.message || 'Archivo JSON corrupto o inválido.');
      setRestoreData(null);
    }
  };

  // 3. Ejecutar Restauración Masiva
  const handleConfirmRestore = async () => {
    if (!restoreData || !restoreData.database) return;
    setRestoring(true);
    setRestoreError(null);
    setRestoreSuccess(null);

    try {
      const supabase = createClient();
      const db = restoreData.database;

      // Upsert en orden de dependencias
      if (db.categories?.length > 0) {
        await supabase.from('categories').upsert(db.categories, { onConflict: 'id' });
      }

      if (db.products?.length > 0) {
        await supabase.from('products').upsert(db.products, { onConflict: 'id' });
      }

      if (db.productVariants?.length > 0) {
        await supabase.from('product_variants').upsert(db.productVariants, { onConflict: 'id' });
      }

      if (db.inventoryStock?.length > 0) {
        await supabase.from('inventory_stock').upsert(db.inventoryStock, { onConflict: 'id' });
      }

      if (db.customers?.length > 0) {
        await supabase.from('customers').upsert(db.customers, { onConflict: 'id' });
      }

      if (db.customerPayments?.length > 0) {
        await supabase.from('customer_payments').upsert(db.customerPayments, { onConflict: 'id' });
      }

      if (db.suppliers?.length > 0) {
        await supabase.from('suppliers').upsert(db.suppliers, { onConflict: 'id' });
      }

      if (db.sales?.length > 0) {
        await supabase.from('sales').upsert(db.sales, { onConflict: 'id' });
      }

      if (db.saleItems?.length > 0) {
        await supabase.from('sale_items').upsert(db.saleItems, { onConflict: 'id' });
      }

      setRestoreSuccess(
        `Restauración completada con éxito. Se importaron ${db.products?.length || 0} productos, ${db.sales?.length || 0} ventas y ${db.customers?.length || 0} clientes.`
      );
      setRestoreData(null);
      setRestoreFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setRestoreError(err?.message || 'Error al restaurar los datos en Supabase.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="rounded-lg bg-white border border-slate-200 p-4 sm:p-5 space-y-6 shadow-xs font-sans">
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
              Copia de Seguridad y Restauración de Datos
            </h3>
            <p className="text-[11px] text-slate-500">
              Respaldo total de existencias, costos, ventas y clientes en tu computadora
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded text-[11px] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Datos 100% Privados</span>
        </div>
      </div>

      {/* Sección 1: Descargar Backup */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div className="sm:col-span-2 space-y-1.5">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            1. Generar Copia de Seguridad (.JSON)
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            Descargá en cualquier momento una <strong>copia de seguridad completa en formato JSON</strong> con
            todos los artículos, compras, kardex histórico, cuentas corrientes y clientes.
          </p>
          {lastBackupDate && (
            <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Último respaldo descargado: {lastBackupDate}</span>
            </p>
          )}
        </div>

        <div className="flex justify-start sm:justify-end">
          <button
            type="button"
            onClick={handleDownloadFullBackup}
            disabled={downloading}
            className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            {downloading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Empaquetando datos...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Descargar Backup (.JSON)</span>
              </>
            )}
          </button>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Sección 2: Restaurar Backup */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-slate-700" />
              <span>2. Restaurar Copia de Seguridad</span>
            </h4>
            <p className="text-xs text-slate-600">
              Selecciona un archivo <code>backup-stocktock-*.json</code> previo para restablecer los registros de tu negocio.
            </p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleSelectRestoreFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={restoring}
              className="h-8 px-3.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Seleccionar Archivo JSON</span>
            </button>
          </div>
        </div>

        {/* Mensaje de error al cargar JSON */}
        {restoreError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{restoreError}</span>
          </div>
        )}

        {/* Mensaje de éxito al restaurar */}
        {restoreSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{restoreSuccess}</span>
          </div>
        )}

        {/* Previsualización del archivo de Backup antes de confirmar */}
        {restoreData && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">
                  Respaldo verificado: {restoreFile?.name}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Emitido: {new Date(restoreData.meta?.exportedAt || '').toLocaleString('es-AR')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Productos</span>
                <strong className="font-mono text-slate-900">
                  {restoreData.meta?.recordCounts?.products ?? restoreData.database?.products?.length ?? 0}
                </strong>
              </div>
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Ventas</span>
                <strong className="font-mono text-slate-900">
                  {restoreData.meta?.recordCounts?.sales ?? restoreData.database?.sales?.length ?? 0}
                </strong>
              </div>
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Clientes</span>
                <strong className="font-mono text-slate-900">
                  {restoreData.meta?.recordCounts?.customers ?? restoreData.database?.customers?.length ?? 0}
                </strong>
              </div>
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Mov. Kardex</span>
                <strong className="font-mono text-slate-900">
                  {restoreData.meta?.recordCounts?.stockMovements ?? restoreData.database?.stockMovements?.length ?? 0}
                </strong>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRestoreData(null);
                  setRestoreFile(null);
                }}
                disabled={restoring}
                className="h-8 px-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={restoring}
                className="h-8 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {restoring && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{restoring ? 'Restaurando...' : 'Confirmar y Restaurar Datos'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
