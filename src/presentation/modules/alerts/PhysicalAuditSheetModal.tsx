'use client';

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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222226] shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-800 text-[#84cc16]">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm">
                Planilla de Conteo Físico de Stock (Auditoría)
              </h3>
              <p className="text-[11px] text-zinc-400">
                Lista de control impresa para recuento manual en estanterías de depósito
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-[#84cc16] text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-[#9ae624] transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Planilla</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-zinc-200 print:text-black print:bg-white print:p-0">
          {/* Print Document Header */}
          <div className="border-b border-[#27272a] print:border-black pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-base font-bold text-zinc-100 print:text-black">
                {companyName || 'Stock-tock Casa Central'}
              </h2>
              <p className="text-xs text-zinc-400 print:text-gray-600 font-mono">
                ACTA DE RECUENTO FÍSICO Y AUDITORÍA DE INVENTARIO
              </p>
            </div>
            <div className="text-right text-xs space-y-1 font-mono text-zinc-400 print:text-gray-700">
              <div>Fecha: ____ / ____ / ________</div>
              <div>Auditor Responsable: ____________________</div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[#27272a] print:border-black text-[11px] uppercase tracking-wider text-zinc-400 print:text-black">
                <th className="py-2 px-2">SKU</th>
                <th className="py-2 px-2">Descripción Producto</th>
                <th className="py-2 px-2">Depósito</th>
                <th className="py-2 px-2 text-right">Sistema (Físico)</th>
                <th className="py-2 px-3 text-center border-l border-r border-[#27272a] print:border-black w-24">
                  Conteo Real
                </th>
                <th className="py-2 px-3 text-center border-r border-[#27272a] print:border-black w-20">
                  Dif (+/-)
                </th>
                <th className="py-2 px-2">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e22] print:divide-gray-300">
              {rows.map((row, idx) => (
                <tr key={idx} className="print:h-9">
                  <td className="py-2 px-2 font-mono text-zinc-300 print:text-black">{row.sku}</td>
                  <td className="py-2 px-2 font-medium text-zinc-100 print:text-black">
                    {row.productName}
                  </td>
                  <td className="py-2 px-2 text-zinc-400 print:text-gray-600 font-mono text-[11px]">
                    {row.warehouseName}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-semibold text-[#84cc16] print:text-black">
                    {row.physicalStock} un.
                  </td>
                  <td className="py-2 px-3 text-center border-l border-r border-[#27272a] print:border-black font-mono">
                    [ &nbsp; &nbsp; &nbsp; &nbsp; ]
                  </td>
                  <td className="py-2 px-3 text-center border-r border-[#27272a] print:border-black font-mono">
                    [ &nbsp; &nbsp; ]
                  </td>
                  <td className="py-2 px-2 text-zinc-500 print:text-gray-500 text-[11px]">
                    ....................................
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer signature line */}
          <div className="pt-8 flex justify-between items-end text-xs font-mono text-zinc-400 print:text-black">
            <div>
              <div className="w-48 border-b border-[#27272a] print:border-black mb-1"></div>
              <span>Firma Auditor / Encargado</span>
            </div>
            <div>
              <div className="w-48 border-b border-[#27272a] print:border-black mb-1"></div>
              <span>Firma Supervisor General</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
