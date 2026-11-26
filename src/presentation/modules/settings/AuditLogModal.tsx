import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  User,
  Clock,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { AuditService } from '@/core/application/services/AuditService';
import { AuditLogEntry, UserRole } from '@/core/domain/security/types';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

export function AuditLogModal({ isOpen, onClose, companyId }: AuditLogModalProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');

  const fetchLogs = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await AuditService.getLogs(companyId, {
        module: selectedModule,
        limit: 150,
      });
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, selectedModule, companyId]);

  const filteredLogs = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.userName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.entityName && l.entityName.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q))
    );
  }, [logs, searchTerm]);

  if (!isOpen) return null;

  // Exportar a CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Fecha/Hora', 'Operador', 'Rol', 'Módulo', 'Acción', 'Entidad', 'Detalles'];
    const rows = filteredLogs.map((l) => [
      new Date(l.createdAt).toLocaleString('es-AR'),
      `"${l.userName.replace(/"/g, '""')}"`,
      l.userRole,
      l.module,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${(l.entityName || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `auditoria_stocktock_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-zinc-900 text-white';
      case 'CASHIER':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70';
      case 'WAREHOUSE':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300';
    }
  };

  const getModuleBadge = (module: string) => {
    switch (module) {
      case 'INVENTARIO':
        return 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/70';
      case 'CATALOGO':
        return 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/70';
      case 'VENTAS':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70';
      case 'CAJA':
        return 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/70';
      case 'SEGURIDAD':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70';
      default:
        return 'bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-13 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 id="audit-modal-title" className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Registro de Auditoría & Trazabilidad (Audit Log)
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                Libro inmutable de cambios de stock, precios, turnos y operaciones críticas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
              className="h-7 px-2.5 rounded-md bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-40"
              title="Descargar eventos en formato Excel/CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className="w-7 h-7 rounded-md bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Actualizar registro"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por operador, acción o detalle..."
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
              <Filter className="w-3 h-3 text-zinc-400 dark:text-zinc-500" /> Módulo:
            </label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-zinc-900"
            >
              <option value="ALL">Todos los módulos</option>
              <option value="INVENTARIO">Inventario & Stock</option>
              <option value="CATALOGO">Catálogo & Precios</option>
              <option value="VENTAS">Ventas & Mostrador</option>
              <option value="CAJA">Caja & Tesorería</option>
              <option value="CONTACTOS">Contactos Comerciales</option>
              <option value="SEGURIDAD">Seguridad & Turnos</option>
            </select>
          </div>
        </div>

        {/* Tabla de Eventos */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-400 dark:text-zinc-500" />
              <span>Consultando libro de auditoría...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center space-y-1">
              <ShieldAlert className="w-6 h-6 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">No se encontraron eventos</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Los eventos de auditoría se registrarán automáticamente a medida que los operadores utilicen el sistema.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-bold sticky top-0 z-10">
                <tr>
                  <th scope="col" className="py-2 px-3 w-36">Fecha & Hora</th>
                  <th scope="col" className="py-2 px-3 w-40">Operador / Rol</th>
                  <th scope="col" className="py-2 px-3 w-28">Módulo</th>
                  <th scope="col" className="py-2 px-3 w-40">Acción</th>
                  <th scope="col" className="py-2 px-3">Detalle del Cambio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-2 px-3 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}{' '}
                      {new Date(log.createdAt).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[110px]">
                          {log.userName}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1 py-0.2 rounded font-mono ${getRoleBadge(
                            log.userRole
                          )}`}
                        >
                          {log.userRole}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getModuleBadge(
                          log.module
                        )}`}
                      >
                        {log.module}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 text-[11px]">
                        {log.action}
                      </span>
                      {log.entityName && (
                        <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-xs">
                          {log.entityName}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300 text-xs">
                      <span className="font-sans break-words">{log.details || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="h-10 px-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
          <span>{filteredLogs.length} eventos registrados en el período</span>
          <span className="font-mono text-[10px]">Trazabilidad Auditada • Stock·tock v1</span>
        </div>
      </div>
    </div>
  );
}
