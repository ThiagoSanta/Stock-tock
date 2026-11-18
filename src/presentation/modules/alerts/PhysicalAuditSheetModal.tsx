import React from 'react';
import { X, Printer, ClipboardList } from 'lucide-react';
import { InventoryExportRow } from '@/core/domain/alerts/types';

interface PhysicalAuditSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: InventoryExportRow[];
  companyName: string;
}

export function PhysicalAuditSheetModal({
  isOpen,
  onClose,
  rows,
  companyName,
}: PhysicalAuditSheetModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-100 text-slate-800 flex items-center justify-center">
              <ClipboardList className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
              Planilla de Conteo Físico de Stock (Auditoría)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 rounded bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Planilla</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-800 print:text-black print:p-0">
          <div className="border-b border-slate-200 print:border-black pb-3 flex justify-between items-start">
            <div>
              <h2 className="text-sm font-bold text-slate-900 print:text-black">
                {companyName || 'Stock-tock Casa Central'}
              </h2>
              <p className="text-[11px] text-slate-500 print:text-gray-600 font-mono">
                ACTA DE RECUENTO FÍSICO Y AUDITORÍA DE INVENTARIO
              </p>
            </div>
            <div className="text-right text-xs space-y-0.5 font-mono text-slate-500 print:text-gray-700">
              <div>Fecha: ____ / ____ / ________</div>
              <div>Auditor Responsable: ____________________</div>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 print:border-black text-[10px] uppercase tracking-wider text-slate-500 print:text-black">
                <th className="py-1.5 px-2">SKU</th>
                <th className="py-1.5 px-2">Descripción Producto</th>
                <th className="py-1.5 px-2">Depósito</th>
                <th className="py-1.5 px-2 text-right">Sistema (Físico)</th>
                <th className="py-1.5 px-3 text-center border-l border-r border-slate-200 print:border-black w-24">
                  Conteo Real
                </th>
                <th className="py-1.5 px-3 text-center border-r border-slate-200 print:border-black w-20">
                  Dif (+/-)
                </th>
                <th className="py-1.5 px-2">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-gray-300">
              {rows.map((row, idx) => (
                <tr key={idx} className="print:h-8 hover:bg-slate-50/50">
                  <td className="py-1.5 px-2 font-mono text-slate-500 print:text-black">{row.sku}</td>
                  <td className="py-1.5 px-2 font-medium text-slate-900 print:text-black">
                    {row.productName}
                  </td>
                  <td className="py-1.5 px-2 text-slate-600 print:text-gray-600 font-mono text-[11px]">
                    {row.warehouseName}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono font-semibold text-slate-900 print:text-black">
                    {row.physicalStock} un.
                  </td>
                  <td className="py-1.5 px-3 text-center border-l border-r border-slate-200 print:border-black font-mono">
                    [ &nbsp; &nbsp; &nbsp; &nbsp; ]
                  </td>
                  <td className="py-1.5 px-3 text-center border-r border-slate-200 print:border-black font-mono">
                    [ &nbsp; &nbsp; ]
                  </td>
                  <td className="py-1.5 px-2 text-slate-400 print:text-gray-500 text-[11px]">
                    ....................................
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pt-6 flex justify-between items-end text-xs font-mono text-slate-500 print:text-black">
            <div>
              <div className="w-44 border-b border-slate-300 print:border-black mb-1"></div>
              <span>Firma Auditor / Encargado</span>
            </div>
            <div>
              <div className="w-44 border-b border-slate-300 print:border-black mb-1"></div>
              <span>Firma Supervisor General</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
