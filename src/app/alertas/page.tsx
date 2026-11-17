'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
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

export default function AlertasPage() {
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

  // KPI metrics
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING').length;
  const infoCount = alerts.filter((a) => a.severity === 'INFO').length;

  const filteredAlerts = useMemo(() => {
    if (severityFilter === 'ALL') return alerts;
    return alerts.filter((a) => a.severity === severityFilter);
  }, [alerts, severityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Dashboard
            </Link>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Centro de Alertas & Reportes
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Detección de quiebres, reservas de pedidos pendientes y herramientas de auditoría física.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="h-9 px-3 rounded-lg bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span>Planilla de Conteo</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="h-9 px-3.5 rounded-lg bg-[#84cc16] hover:bg-[#9ae624] text-black font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-[0_0_15px_rgba(132,204,22,0.25)]"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Stock CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          subtitle="Requieren reabastecimiento"
          icon={AlertTriangle}
          isAlert={warningCount > 0}
        />
        <MetricCard
          title="Avisos Informativos"
          value={infoCount.toString()}
          subtitle="Sobrestock / optimizaciones"
          icon={Info}
        />
        <MetricCard
          title="Artículos Auditados"
          value={exportRows.length.toString()}
          subtitle="Disponibles para exportación"
          icon={FileSpreadsheet}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-[#121214] p-1.5 rounded-xl border border-[#222226] overflow-x-auto">
        <button
          onClick={() => setSeverityFilter('ALL')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            severityFilter === 'ALL'
              ? 'bg-zinc-800 text-zinc-100 shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Todas ({alerts.length})
        </button>
        <button
          onClick={() => setSeverityFilter('CRITICAL')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            severityFilter === 'CRITICAL'
              ? 'bg-rose-950/60 text-rose-300 border border-rose-900/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Críticas ({criticalCount})
        </button>
        <button
          onClick={() => setSeverityFilter('WARNING')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            severityFilter === 'WARNING'
              ? 'bg-amber-950/60 text-amber-300 border border-amber-900/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Advertencias ({warningCount})
        </button>
        <button
          onClick={() => setSeverityFilter('INFO')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            severityFilter === 'INFO'
              ? 'bg-sky-950/60 text-sky-300 border border-sky-900/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Informativas ({infoCount})
        </button>
      </div>

      {/* Alerts Feed */}
      {loading ? (
        <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226]">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Analizando umbrales y reservas de inventario...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226] space-y-2">
          <CheckCircle2 className="w-8 h-8 text-[#84cc16] mx-auto" />
          <h4 className="text-sm font-semibold text-zinc-300">
            {severityFilter === 'ALL'
              ? 'No hay alertas operativas activas'
              : 'No hay alertas en esta categoría'}
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            El stock disponible supera los umbrales mínimos y no hay pedidos con retención demorada.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
