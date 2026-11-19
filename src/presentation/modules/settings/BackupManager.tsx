import React, { useState } from 'react';
import { Database, Download, ShieldCheck, CheckCircle2, RefreshCw, FileText } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface BackupManagerProps {
  companyId: string;
  companyName: string;
}

export function BackupManager({ companyId, companyName }: BackupManagerProps) {
  const [downloading, setDownloading] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

  const handleDownloadFullBackup = async () => {
    setDownloading(true);
    try {
      const supabase = createClient();

      const [
        companiesRes,
        warehousesRes,
        categoriesRes,
        productsRes,
        variantsRes,
        stockRes,
        movementsRes,
        customersRes,
        suppliersRes,
        salesRes,
        saleItemsRes,
        purchasesRes,
        ordersRes,
      ] = await Promise.all([
        supabase.from('companies').select('*').eq('id', companyId),
        supabase.from('warehouses').select('*').eq('company_id', companyId),
        supabase.from('categories').select('*').eq('company_id', companyId),
        supabase.from('products').select('*').eq('company_id', companyId),
        supabase.from('product_variants').select('*'),
        supabase.from('inventory_stock').select('*').eq('company_id', companyId),
        supabase.from('stock_movements').select('*').eq('company_id', companyId),
        supabase.from('customers').select('*').eq('company_id', companyId),
        supabase.from('suppliers').select('*').eq('company_id', companyId),
        supabase.from('sales').select('*').eq('company_id', companyId),
        supabase.from('sale_items').select('*'),
        supabase.from('purchases').select('*').eq('company_id', companyId),
        supabase.from('orders').select('*').eq('company_id', companyId),
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
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
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

  return (
    <div className="rounded-lg bg-white border border-slate-200 p-4 sm:p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
              Copia de Seguridad y Soberanía de Datos
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div className="sm:col-span-2 space-y-1.5">
          <p className="text-xs text-slate-700 leading-relaxed">
            Al no reportar a ningún organismo fiscal ni servidores de terceros, tus datos son únicamente tuyos.
            Podés descargar en cualquier momento una <strong>copia de seguridad completa en formato JSON</strong> con
            todos los artículos, compras, kardex histórico y clientes.
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
                <span>Descargar Backup Completo (.JSON)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
