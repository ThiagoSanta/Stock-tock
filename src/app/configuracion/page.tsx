'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, Database, CheckCircle2 } from 'lucide-react';
import { CompanySettings, WarehouseSettings } from '@/core/domain/settings/types';
import { SupabaseSettingsRepository } from '@/core/infrastructure/repositories/SupabaseSettingsRepository';
import { GetCompanySettingsUseCase } from '@/core/application/use-cases/settings/GetCompanySettingsUseCase';
import { UpdateCompanySettingsUseCase, UpdateCompanyDTO } from '@/core/application/use-cases/settings/UpdateCompanySettingsUseCase';
import { ManageWarehousesUseCase, CreateWarehouseDTO } from '@/core/application/use-cases/settings/ManageWarehousesUseCase';
import { CompanyForm } from '@/presentation/modules/settings/CompanyForm';
import { WarehouseManager } from '@/presentation/modules/settings/WarehouseManager';
import { BusinessRulesViewer } from '@/presentation/modules/settings/BusinessRulesViewer';

export default function ConfiguracionPage() {
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [warehouses, setWarehouses] = useState<WarehouseSettings[]>([]);
  const [loading, setLoading] = useState(true);

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
    setCompany(updated);
  };

  const handleCreateWarehouse = async (dto: CreateWarehouseDTO) => {
    await manageWhUseCase.create(dto);
    await loadData();
  };

  const handleSetDefaultWarehouse = async (warehouseId: string) => {
    if (!company) return;
    await manageWhUseCase.setDefault(company.id, warehouseId);
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
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
            <Settings className="w-5 h-5 text-[#84cc16]" />
            Configuración del Sistema
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gestión de perfiles de empresa, depósitos físicos y reglas comerciales inviolables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141518] border border-[#27272a] text-[11px] font-mono text-zinc-400">
            <Database className="w-3.5 h-3.5 text-[#84cc16]" />
            <span>PostgreSQL Conectado</span>
          </div>
        </div>
      </div>

      {loading || !company ? (
        <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226]">
          <div className="w-6 h-6 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Cargando parámetros de configuración...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <CompanyForm company={company} onUpdate={handleUpdateCompany} />

          <WarehouseManager
            companyId={company.id}
            warehouses={warehouses}
            onCreateWarehouse={handleCreateWarehouse}
            onSetDefault={handleSetDefaultWarehouse}
          />

          <BusinessRulesViewer />
        </div>
      )}
    </div>
  );
}
