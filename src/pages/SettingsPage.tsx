import React, { useEffect, useState, useMemo } from 'react';
import { Settings, Database, ShieldAlert, Sun, Moon } from 'lucide-react';
import { PageHeader, Button, Badge } from '@/presentation/components/ui';
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
      <PageHeader
        title="Configuración del Sistema"
        icon={<Settings className="w-3.5 h-3.5" />}
        actions={
          <Badge variant="neutral" mono dot pulse>
            <Database className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>PostgreSQL Cloud • Conectado</span>
          </Badge>
        }
      />

      {loading || !company ? (
        <div className="p-8 text-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="w-5 h-5 border-2 border-zinc-800 dark:border-zinc-200 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Cargando parámetros...</p>
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
          <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="w-6 h-6 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center">
                <Sun className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Apariencia & Visualización
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Preferencia de tema visual para mostrador o ambientes con poca luz
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                  Tema Visual de la Interfaz
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isDark
                    ? 'Modo Oscuro activo: paleta negro grafito mate para descanso visual en mostrador nocturno.'
                    : 'Modo Claro activo: contraste diurno nítido para entornos luminosos.'}
                </p>
              </div>

              {/* Segmented Control de Tema */}
              <div className="inline-flex p-1 rounded-lg bg-zinc-200/70 dark:bg-zinc-950 border border-zinc-300/70 dark:border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => isDark && toggleTheme()}
                  className={`h-7 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    !isDark
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs border border-zinc-300/60'
                      : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-200'
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
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-lime-500 dark:text-lime-400" />
                  <span>Oscuro</span>
                </button>
              </div>
            </div>
          </div>

          {/* Seguridad & Auditoría — solo Admin */}
          {permissions.canManageUsers && (
            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
                <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                  <ShieldAlert className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Seguridad & Auditoría</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Registro inmutable de operaciones del sistema</p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAuditLog(true)}
                leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
              >
                Ver Registro de Auditoría
              </Button>
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
