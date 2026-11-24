import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, Database, ShieldAlert, Sun, Moon, MonitorDown, CheckCircle2 } from 'lucide-react';
import { CompanySettings, WarehouseSettings } from '@/core/domain/settings/types';
import { SupabaseSettingsRepository } from '@/core/infrastructure/repositories/SupabaseSettingsRepository';
import { GetCompanySettingsUseCase } from '@/core/application/use-cases/settings/GetCompanySettingsUseCase';
import { UpdateCompanySettingsUseCase, UpdateCompanyDTO } from '@/core/application/use-cases/settings/UpdateCompanySettingsUseCase';
import { ManageWarehousesUseCase, CreateWarehouseDTO } from '@/core/application/use-cases/settings/ManageWarehousesUseCase';
import { CompanyForm } from '@/presentation/modules/settings/CompanyForm';
import { WarehouseManager } from '@/presentation/modules/settings/WarehouseManager';
import { BackupManager } from '@/presentation/modules/settings/BackupManager';
import { BusinessRulesViewer } from '@/presentation/modules/settings/BusinessRulesViewer';
import { AuditLogModal } from '@/presentation/modules/settings/AuditLogModal';
import { useUserRole } from '@/utils/security/UserRoleContext';
import { useTheme } from '@/utils/theme/ThemeContext';
import { usePwaInstall } from '@/utils/pwa/usePwaInstall';
import { invalidateCompanyContext } from '@/utils/supabase/companyContext';

export function SettingsPage() {
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [warehouses, setWarehouses] = useState<WarehouseSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const { permissions } = useUserRole();
  const { theme, toggleTheme, isDark } = useTheme();
  const { isInstallable, isInstalled, installApp } = usePwaInstall();

  const settingsRepo = useMemo(() => new SupabaseSettingsRepository(), []);
  const getSettingsUseCase = useMemo(() => new GetCompanySettingsUseCase(settingsRepo), [settingsRepo]);
  const updateCompanyUseCase = useMemo(() => new UpdateCompanySettingsUseCase(settingsRepo), [settingsRepo]);
  const manageWhUseCase = useMemo(() => new ManageWarehousesUseCase(settingsRepo), [settingsRepo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getSettingsUseCase.execute();
      setCompany(data.company);
      setWarehouses(data.warehouses);
    } catch (err) {
      console.error('Error cargando configuración:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [getSettingsUseCase]);

  const handleUpdateCompany = async (dto: UpdateCompanyDTO) => {
    const updated = await updateCompanyUseCase.execute(dto);
    invalidateCompanyContext();
    setCompany(updated);
  };

  const handleCreateWarehouse = async (dto: CreateWarehouseDTO) => {
    await manageWhUseCase.create(dto);
    invalidateCompanyContext();
    await loadData();
  };

  const handleSetDefaultWarehouse = async (warehouseId: string) => {
    if (!company) return;
    await manageWhUseCase.setDefault(company.id, warehouseId);
    invalidateCompanyContext();
    await loadData();
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
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
              <Settings className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Configuración del Sistema
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Database className="w-3.5 h-3.5 text-slate-600" />
          <span>PostgreSQL Cloud • Conectado</span>
        </div>
      </div>

      {loading || !company ? (
        <div className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Cargando parámetros...</p>
        </div>
      ) : (
        <div className="space-y-5">
          <CompanyForm company={company} onUpdate={handleUpdateCompany} />

          <WarehouseManager
            companyId={company.id}
            warehouses={warehouses}
            onCreateWarehouse={handleCreateWarehouse}
            onSetDefault={handleSetDefaultWarehouse}
          />

          <BackupManager
            companyId={company.id}
            companyName={company.name}
          />

          <BusinessRulesViewer />

          {/* Apariencia & Visualización — Modo Oscuro */}
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
                <Sun className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Apariencia & Visualización
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Preferencia de tema visual para mostrador o ambientes con poca luz
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                  Tema Visual de la Interfaz
                </span>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {isDark
                    ? 'Modo Oscuro activo: paleta negro grafito mate para descanso visual en mostrador nocturno.'
                    : 'Modo Claro activo: contraste diurno nítido para entornos luminosos.'}
                </p>
              </div>

              {/* Segmented Control de Tema */}
              <div className="inline-flex p-1 rounded-lg bg-slate-200/70 dark:bg-zinc-950 border border-slate-300/70 dark:border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => isDark && toggleTheme()}
                  className={`h-7 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    !isDark
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-300/60'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Claro</span>
                </button>
                <button
                  type="button"
                  onClick={() => !isDark && toggleTheme()}
                  className={`h-7 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isDark
                      ? 'bg-zinc-800 text-zinc-100 shadow-2xs border border-zinc-700 ring-1 ring-lime-500/50'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-lime-400" />
                  <span>Oscuro</span>
                </button>
              </div>
            </div>
          </div>

          {/* Seguridad & Auditoría — solo Admin */}
          {permissions.canManageUsers && (
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Seguridad & Auditoría</h3>
                  <p className="text-xs text-slate-500 font-medium">Registro inmutable de operaciones del sistema</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditLog(true)}
                className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Ver Registro de Auditoría
              </button>
            </div>
          )}
        </div>
      )}

      {/* AuditLog Modal */}
      {company && (
        <AuditLogModal
          isOpen={showAuditLog}
          onClose={() => setShowAuditLog(false)}
          companyId={company.id}
        />
      )}
    </div>
  );
}
