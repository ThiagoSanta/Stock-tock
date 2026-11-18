import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  Info,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { SystemAlert, InventoryExportRow } from '@/core/domain/alerts/types';
import { SupabaseAlertRepository } from '@/core/infrastructure/repositories/SupabaseAlertRepository';
import { GetSystemAlertsUseCase } from '@/core/application/use-cases/alerts/GetSystemAlertsUseCase';
import { ExportInventoryReportUseCase } from '@/core/application/use-cases/alerts/ExportInventoryReportUseCase';
import { AlertCard } from '@/presentation/modules/alerts/AlertCard';
import { PhysicalAuditSheetModal } from '@/presentation/modules/alerts/PhysicalAuditSheetModal';
import { MetricCard } from '@/presentation/components/MetricCard';
import { createClient } from '@/utils/supabase/client';

export function AlertsPage() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [exportRows, setExportRows] = useState<InventoryExportRow[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const alertRepo = useMemo(() => new SupabaseAlertRepository(), []);
  const getAlertsUseCase = useMemo(() => new GetSystemAlertsUseCase(alertRepo), [alertRepo]);
  const exportUseCase = useMemo(() => new ExportInventoryReportUseCase(alertRepo), [alertRepo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: companies } = await supabase.from('companies').select('id, name').limit(1);

      if (companies && companies.length > 0) {
        const c = companies[0];
        setCompanyName(c.name);

        const [alertsList, rows] = await Promise.all([
          getAlertsUseCase.execute(c.id),
          exportUseCase.getExportData(c.id),
        ]);

        setAlerts(alertsList);
        setExportRows(rows);
      }
    } catch (err) {
      console.error('Error cargando alertas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [getAlertsUseCase, exportUseCase]);

  const handleDownloadCSV = () => {
    if (exportRows.length === 0) return;
    const csvContent = exportUseCase.generateCSV(exportRows);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `balance-inventario-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING').length;
  const infoCount = alerts.filter((a) => a.severity === 'INFO').length;

  const filteredAlerts = useMemo(() => {
    if (severityFilter === 'ALL') return alerts;
    return alerts.filter((a) => a.severity === severityFilter);
  }, [alerts, severityFilter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link
              to="/"
              className="hover:text-slate-700 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-100 text-slate-800 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Centro de Alertas & Reportes
            </h1>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="h-8 px-3 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Planilla Conteo</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Alertas Críticas"
          value={criticalCount.toString()}
          subtitle="Quiebres y reservas urgentes"
          icon={ShieldAlert}
          isAlert={criticalCount > 0}
        />
        <MetricCard
          title="Stock por Debajo del Mínimo"
          value={warningCount.toString()}
          subtitle="Requieren reposición"
          icon={AlertTriangle}
          isAlert={warningCount > 0}
        />
        <MetricCard
          title="Avisos Informativos"
          value={infoCount.toString()}
          subtitle="Sobrestock / avisos"
          icon={Info}
        />
        <MetricCard
          title="Artículos Auditados"
          value={exportRows.length.toString()}
          subtitle="En el catálogo activo"
          icon={FileSpreadsheet}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs w-fit overflow-x-auto border border-slate-200">
        <button
          onClick={() => setSeverityFilter('ALL')}
          className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
            severityFilter === 'ALL'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todas ({alerts.length})
        </button>
        <button
          onClick={() => setSeverityFilter('CRITICAL')}
          className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
            severityFilter === 'CRITICAL'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Críticas ({criticalCount})
        </button>
        <button
          onClick={() => setSeverityFilter('WARNING')}
          className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
            severityFilter === 'WARNING'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Advertencias ({warningCount})
        </button>
        <button
          onClick={() => setSeverityFilter('INFO')}
          className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
            severityFilter === 'INFO'
              ? 'bg-sky-50 text-sky-700 border border-sky-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Informativas ({infoCount})
        </button>
      </div>

      {/* Alerts Feed */}
      {loading ? (
        <div className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Analizando umbrales y reservas...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="p-8 text-center rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <h4 className="text-xs font-semibold text-slate-900">
            {severityFilter === 'ALL'
              ? 'No hay alertas operativas activas'
              : 'No hay alertas en esta categoría'}
          </h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            El stock disponible supera los umbrales mínimos y no hay pedidos con retención demorada.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* Audit Sheet Modal */}
      {isAuditModalOpen && (
        <PhysicalAuditSheetModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          rows={exportRows}
          companyName={companyName}
        />
      )}
    </div>
  );
}
