import React, { useEffect, useState, useMemo } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  ClipboardCheck,
  TrendingUp,
} from 'lucide-react';
import { PageHeader, Button } from '@/presentation/components/ui';
import { SystemAlert, InventoryExportRow } from '@/core/domain/alerts/types';
import { SupabaseAlertRepository } from '@/core/infrastructure/repositories/SupabaseAlertRepository';
import { GetSystemAlertsUseCase } from '@/core/application/use-cases/alerts/GetSystemAlertsUseCase';
import { ExportInventoryReportUseCase } from '@/core/application/use-cases/alerts/ExportInventoryReportUseCase';
import { AlertCard } from '@/presentation/modules/alerts/AlertCard';
import { PhysicalAuditSheetModal } from '@/presentation/modules/alerts/PhysicalAuditSheetModal';
import { InventoryReconciliationModal } from '@/presentation/modules/alerts/InventoryReconciliationModal';
import { RestockSuggestionsCard } from '@/presentation/modules/alerts/RestockSuggestionsCard';
import { ExpiryAlertCard } from '@/presentation/modules/alerts/ExpiryAlertCard';
import { ProfitabilityReport } from '@/presentation/modules/alerts/ProfitabilityReport';
import { MetricCard } from '@/presentation/components/MetricCard';
import { getCompanyContext } from '@/utils/supabase/companyContext';

export function AlertsPage() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [exportRows, setExportRows] = useState<InventoryExportRow[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [companyId, setCompanyId] = useState<string>('');
  const [defaultWarehouseId, setDefaultWarehouseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activePageTab, setActivePageTab] = useState<'AUDIT' | 'PROFITABILITY'>('AUDIT');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);

  const alertRepo = useMemo(() => new SupabaseAlertRepository(), []);
  const getAlertsUseCase = useMemo(() => new GetSystemAlertsUseCase(alertRepo), [alertRepo]);
  const exportUseCase = useMemo(() => new ExportInventoryReportUseCase(alertRepo), [alertRepo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const context = await getCompanyContext();
      if (context) {
        setCompanyName(context.companyName);
        setCompanyId(context.companyId);
        setDefaultWarehouseId(context.defaultWarehouseId);

        const [alertsList, rows] = await Promise.all([
          getAlertsUseCase.execute(context.companyId),
          exportUseCase.getExportData(context.companyId),
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
      <PageHeader
        title="Centro de Alertas & Reportes"
        icon={<AlertTriangle className="w-3.5 h-3.5" />}
        actions={
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsReconcileModalOpen(true)}
              leftIcon={<ClipboardCheck className="w-3.5 h-3.5" />}
            >
              Conciliar Inventario
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAuditModalOpen(true)}
              leftIcon={<Printer className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />}
            >
              Planilla Conteo
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadCSV}
              leftIcon={<Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />}
            >
              Exportar CSV
            </Button>
          </>
        }
      />

      {/* Pestañas Principales: Auditoría vs Rentabilidad */}
      <div className="flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActivePageTab('AUDIT')}
          className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activePageTab === 'AUDIT'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Control de Stock & Auditoría</span>
        </button>

        <button
          type="button"
          onClick={() => setActivePageTab('PROFITABILITY')}
          className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activePageTab === 'PROFITABILITY'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Rentabilidad & Productos Estrella</span>
        </button>
      </div>

      {activePageTab === 'PROFITABILITY' ? (
        <ProfitabilityReport companyId={companyId} />
      ) : (
        <>
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
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg text-xs w-fit overflow-x-auto border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setSeverityFilter('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                severityFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Todas ({alerts.length})
            </button>
            <button
              onClick={() => setSeverityFilter('CRITICAL')}
              className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                severityFilter === 'CRITICAL'
                  ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Críticas ({criticalCount})
            </button>
            <button
              onClick={() => setSeverityFilter('WARNING')}
              className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                severityFilter === 'WARNING'
                  ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Advertencias ({warningCount})
            </button>
            <button
              onClick={() => setSeverityFilter('INFO')}
              className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                severityFilter === 'INFO'
                  ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Informativas ({infoCount})
            </button>
          </div>

          {/* Control Preventivo de Vencimientos (FIFO) */}
          <ExpiryAlertCard companyId={companyId} />

          {/* Sugerencias de Reabastecimiento Automatizadas */}
          <RestockSuggestionsCard products={exportRows} />

          {/* Alerts Feed */}
          {loading ? (
            <div className="p-8 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div className="w-5 h-5 border-2 border-zinc-800 dark:border-zinc-200 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Analizando umbrales y reservas...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-8 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {severityFilter === 'ALL'
                  ? 'No hay alertas operativas activas'
                  : 'No hay alertas en esta categoría'}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
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
        </>
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

      {/* Reconciliation Modal */}
      {isReconcileModalOpen && (
        <InventoryReconciliationModal
          isOpen={isReconcileModalOpen}
          onClose={() => setIsReconcileModalOpen(false)}
          products={exportRows}
          companyId={companyId}
          warehouseId={defaultWarehouseId}
          onReconciliationComplete={loadData}
        />
      )}
    </div>
  );
}
