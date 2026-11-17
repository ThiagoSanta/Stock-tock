'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Truck, Plus, Search, DollarSign, Building2 } from 'lucide-react';
import { CustomerWithMetrics, SupplierWithMetrics } from '@/core/domain/contacts/types';
import { SupabaseContactRepository } from '@/core/infrastructure/repositories/SupabaseContactRepository';
import { GetContactsUseCase } from '@/core/application/use-cases/contacts/GetContactsUseCase';
import { CreateCustomerUseCase, CreateCustomerDTO } from '@/core/application/use-cases/contacts/CreateCustomerUseCase';
import { CreateSupplierUseCase, CreateSupplierDTO } from '@/core/application/use-cases/contacts/CreateSupplierUseCase';
import { ToggleContactStatusUseCase } from '@/core/application/use-cases/contacts/ToggleContactStatusUseCase';
import { CustomerTable } from '@/presentation/modules/contacts/CustomerTable';
import { SupplierTable } from '@/presentation/modules/contacts/SupplierTable';
import { ContactModal } from '@/presentation/modules/contacts/ContactModal';
import { MetricCard } from '@/presentation/components/MetricCard';
import { createClient } from '@/utils/supabase/client';

export default function ContactosPage() {
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'SUPPLIERS'>('CUSTOMERS');
  const [customers, setCustomers] = useState<CustomerWithMetrics[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierWithMetrics[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const contactRepo = useMemo(() => new SupabaseContactRepository(), []);
  const getContactsUseCase = useMemo(() => new GetContactsUseCase(contactRepo), [contactRepo]);
  const createCustomerUseCase = useMemo(() => new CreateCustomerUseCase(contactRepo), [contactRepo]);
  const createSupplierUseCase = useMemo(() => new CreateSupplierUseCase(contactRepo), [contactRepo]);
  const toggleStatusUseCase = useMemo(() => new ToggleContactStatusUseCase(contactRepo), [contactRepo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: companies } = await supabase.from('companies').select('id').limit(1);

      if (companies && companies.length > 0) {
        const cId = companies[0].id;
        setCompanyId(cId);

        const [custs, supps] = await Promise.all([
          getContactsUseCase.executeCustomers(cId),
          getContactsUseCase.executeSuppliers(cId),
        ]);

        setCustomers(custs);
        setSuppliers(supps);
      }
    } catch (err) {
      console.error('Error cargando contactos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [getContactsUseCase]);

  const handleCreateCustomer = async (dto: CreateCustomerDTO) => {
    await createCustomerUseCase.execute(dto);
    await loadData();
  };

  const handleCreateSupplier = async (dto: CreateSupplierDTO) => {
    await createSupplierUseCase.execute(dto);
    await loadData();
  };

  const handleToggleCustomer = async (id: string, newStatus: boolean) => {
    await toggleStatusUseCase.executeCustomer(id, newStatus);
    await loadData();
  };

  const handleToggleSupplier = async (id: string, newStatus: boolean) => {
    await toggleStatusUseCase.executeSupplier(id, newStatus);
    await loadData();
  };

  // KPIs
  const totalSalesToCustomers = customers.reduce((acc, c) => acc + c.totalSpent, 0);
  const activeCustomersCount = customers.filter((c) => c.active).length;
  const totalPurchasesFromSuppliers = suppliers.reduce((acc, s) => acc + s.totalSpent, 0);
  const activeSuppliersCount = suppliers.filter((s) => s.active).length;

  // Filtrado
  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.taxId && c.taxId.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q))
    );
  }, [customers, searchTerm]);

  const filteredSuppliers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.taxId && s.taxId.toLowerCase().includes(q)) ||
        (s.contactName && s.contactName.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  }, [suppliers, searchTerm]);

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
            <Users className="w-5 h-5 text-[#84cc16]" />
            Clientes & Proveedores
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Directorio integral de cuentas comerciales, datos de contacto fiscal y balances comerciales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-9 px-3.5 rounded-lg bg-[#84cc16] hover:bg-[#9ae624] text-black font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-[0_0_15px_rgba(132,204,22,0.25)]"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Contacto</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Clientes"
          value={customers.length.toString()}
          subtitle={`${activeCustomersCount} activos`}
          icon={Users}
        />
        <MetricCard
          title="Facturación a Clientes"
          value={`$${totalSalesToCustomers.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle="Ventas directas y despachos"
          icon={DollarSign}
        />
        <MetricCard
          title="Total Proveedores"
          value={suppliers.length.toString()}
          subtitle={`${activeSuppliersCount} activos`}
          icon={Truck}
        />
        <MetricCard
          title="Volumen Compras"
          value={`$${totalPurchasesFromSuppliers.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle="Abastecimiento acumulado"
          icon={Building2}
        />
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121214] p-2 rounded-xl border border-[#222226]">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-lg border border-[#27272a] w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
              activeTab === 'CUSTOMERS'
                ? 'bg-zinc-800 text-zinc-100 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clientes ({customers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
              activeTab === 'SUPPLIERS'
                ? 'bg-zinc-800 text-[#84cc16] shadow font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Proveedores ({suppliers.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'CUSTOMERS'
                ? 'Buscar cliente, CUIT, email...'
                : 'Buscar proveedor, contacto, CUIT...'
            }
            className="w-full h-8 pl-9 pr-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-[#84cc16] transition-colors"
          />
        </div>
      </div>

      {/* Tables based on Active Tab */}
      {activeTab === 'CUSTOMERS' ? (
        <CustomerTable
          customers={filteredCustomers}
          loading={loading}
          onToggleStatus={handleToggleCustomer}
        />
      ) : (
        <SupplierTable
          suppliers={filteredSuppliers}
          loading={loading}
          onToggleStatus={handleToggleSupplier}
        />
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <ContactModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          defaultType={activeTab === 'CUSTOMERS' ? 'CUSTOMER' : 'SUPPLIER'}
          companyId={companyId}
          onCreateCustomer={handleCreateCustomer}
          onCreateSupplier={handleCreateSupplier}
        />
      )}
    </div>
  );
}
