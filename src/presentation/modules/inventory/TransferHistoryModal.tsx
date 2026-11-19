import React, { useState, useEffect, useMemo } from 'react';
import { X, History, Printer, ArrowRight, ArrowRightLeft, Search } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getCompanyContext } from '@/utils/supabase/companyContext';

interface TransferRecord {
  id: string;
  transferNumber: string;
  createdAt: string;
  productName: string;
  productSku: string;
  quantity: number;
  originWarehouse: string;
  destWarehouse: string;
  notes: string | null;
}

interface TransferHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
}

export function TransferHistoryModal({
  isOpen,
  onClose,
  companyName,
}: TransferHistoryModalProps) {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeRemito, setActiveRemito] = useState<TransferRecord | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const ctx = await getCompanyContext();
      if (!ctx) return;

      // Consultar movimientos de salida de transferencias (cada transferencia tiene 1 salida)
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          id,
          reference_id,
          quantity,
          created_at,
          notes,
          warehouse_id,
          product_id,
          products (name, sku),
          warehouses (name)
        `)
        .eq('company_id', ctx.companyId)
        .eq('movement_type', 'TRANSFERENCIA_SALIDA')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Para cada salida, obtener el destino desde la entrada correspondiente o las notas
      const list: TransferRecord[] = (data || []).map((m: any) => {
        // Notas suele ser: "Motivo (Hacia Depósito Destino)" o "Transferencia hacia Depósito Destino"
        let destName = 'Depósito Destino';
        const match = m.notes?.match(/Hacia (.+?)\)?$/i) || m.notes?.match(/hacia (.+?)$/i);
        if (match) {
          destName = match[1].replace(')', '').trim();
        }

        return {
          id: m.id,
          transferNumber: m.reference_id || `TRF-${m.id.slice(0, 6).toUpperCase()}`,
          createdAt: m.created_at,
          productName: m.products?.name || 'Producto',
          productSku: m.products?.sku || '—',
          quantity: Math.abs(Number(m.quantity)),
          originWarehouse: m.warehouses?.name || 'Depósito Origen',
          destWarehouse: destName,
          notes: m.notes,
        };
      });

      setTransfers(list);
    } catch (err) {
      console.error('Error cargando historial de transferencias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveRemito(null);
      loadHistory();
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return transfers;
    return transfers.filter(
      (t) =>
        t.transferNumber.toLowerCase().includes(q) ||
        t.productName.toLowerCase().includes(q) ||
        t.productSku.toLowerCase().includes(q) ||
        t.originWarehouse.toLowerCase().includes(q) ||
        t.destWarehouse.toLowerCase().includes(q)
    );
  }, [transfers, search]);

  const handlePrintRemito = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-4xl max-h-[90vh] rounded-lg bg-white border border-slate-300 shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center">
              <History className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Historial de Remitos de Transferencia Interna
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

        {/* Remito A4 View (Printable) */}
        {activeRemito ? (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 print:hidden">
              <button
                type="button"
                onClick={() => setActiveRemito(null)}
                className="h-7 px-3 rounded border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ← Volver al listado
              </button>
              <button
                type="button"
                onClick={handlePrintRemito}
                className="h-8 px-4 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Remito A4</span>
              </button>
            </div>

            {/* Hoja A4 del Remito */}
            <div id="printable-a4-voucher" className="bg-white p-6 border border-slate-300 rounded max-w-2xl mx-auto w-full space-y-6 text-slate-900 font-sans shadow-sm print:border-none print:shadow-none print:p-0">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight">{companyName}</h1>
                  <p className="text-xs text-slate-600 font-medium">Control Logístico de Almacén</p>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-black tracking-wider uppercase">
                    Remito de Transferencia
                  </div>
                  <p className="text-base font-black font-mono mt-1 text-slate-900">{activeRemito.transferNumber}</p>
                  <p className="text-xs text-slate-500 font-medium">
                    {new Date(activeRemito.createdAt).toLocaleDateString('es-AR')} {new Date(activeRemito.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Origen y Destino */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Depósito Origen</span>
                  <span className="font-bold text-slate-900 text-sm">{activeRemito.originWarehouse}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Depósito Destino</span>
                  <span className="font-bold text-slate-900 text-sm">{activeRemito.destWarehouse}</span>
                </div>
              </div>

              {/* Detalle de Mercadería */}
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 border-b border-slate-300 uppercase text-[10px] font-bold text-slate-700">
                  <tr>
                    <th className="py-2 px-3">Código / SKU</th>
                    <th className="py-2 px-3">Descripción de Mercadería</th>
                    <th className="py-2 px-3 text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-3 px-3 font-mono font-medium text-slate-700">{activeRemito.productSku}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{activeRemito.productName}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                      {activeRemito.quantity.toLocaleString('es-AR')} un.
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Motivo / Observaciones */}
              {activeRemito.notes && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
                  <span className="font-bold text-slate-800 block text-[11px] mb-0.5">Observaciones:</span>
                  {activeRemito.notes}
                </div>
              )}

              {/* Firmas */}
              <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs text-slate-600">
                <div className="border-t border-slate-400 pt-2">
                  <span className="font-semibold block text-slate-800">Entregó (Origen)</span>
                  <span className="text-[10px] text-slate-500">Firma y Aclaración</span>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <span className="font-semibold block text-slate-800">Transportó</span>
                  <span className="text-[10px] text-slate-500">Firma y Aclaración</span>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <span className="font-semibold block text-slate-800">Recibió (Destino)</span>
                  <span className="text-[10px] text-slate-500">Firma y Aclaración</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
                DOCUMENTO DE CONTROL COMERCIAL INTERNO • TRASLADO ENTRE SUCURSALES / DEPÓSITOS • SIN VALIDEZ FISCAL
              </div>
            </div>
          </div>
        ) : (
          /* Table of Transfers */
          <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por Nº remito, producto, depósito..."
                  className="w-full h-8 pl-8 pr-3 rounded border border-slate-300 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {filtered.length} transferencias registradas
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Cargando transferencias...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No se registraron transferencias entre depósitos.
              </div>
            ) : (
              <div className="rounded border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[11px] font-bold text-slate-700">
                    <tr>
                      <th className="py-2 px-3">Nº Remito</th>
                      <th className="py-2 px-3">Fecha & Hora</th>
                      <th className="py-2 px-3">Origen → Destino</th>
                      <th className="py-2 px-3">Producto</th>
                      <th className="py-2 px-3 text-right">Cantidad</th>
                      <th className="py-2 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {item.transferNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-xs">
                          {new Date(item.createdAt).toLocaleDateString('es-AR')} {new Date(item.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-slate-800 font-medium">
                            {item.originWarehouse}
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            {item.destWarehouse}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 block">{item.productName}</span>
                          <span className="font-mono text-[11px] text-slate-500">{item.productSku}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {item.quantity.toLocaleString('es-AR')} un.
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setActiveRemito(item)}
                            title="Ver e imprimir Remito A4"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Ver Remito</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="h-11 px-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <p className="text-[11px] text-slate-500">
            Los remitos se registran automáticamente en cada traspaso interno
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
