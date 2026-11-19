import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import { CustomerPaymentModal } from '@/presentation/modules/contacts/CustomerPaymentModal';
import { CustomerAccountStatementModal } from '@/presentation/modules/contacts/CustomerAccountStatementModal';
import { MetricCard } from '@/presentation/components/MetricCard';
import { getCompanyContext } from '@/utils/supabase/companyContext';

export function ContactsPage() {
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'SUPPLIERS'>('CUSTOMERS');
  const [customers, setCustomers] = useState<CustomerWithMetrics[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierWithMetrics[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('Stock·tock');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payingCustomer, setPayingCustomer] = useState<CustomerWithMetrics | null>(null);
  const [statementCustomer, setStatementCustomer] = useState<CustomerWithMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const contactRepo = useMemo(() => new SupabaseContactRepository(), []);
  const getContactsUseCase = useMemo(() => new GetContactsUseCase(contactRepo), [contactRepo]);
  const createCustomerUseCase = useMemo(() => new CreateCustomerUseCase(contactRepo), [contactRepo]);
  const createSupplierUseCase = useMemo(() => new CreateSupplierUseCase(contactRepo), [contactRepo]);
  const toggleStatusUseCase = useMemo(() => new ToggleContactStatusUseCase(contactRepo), [contactRepo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const context = await getCompanyContext();
      if (context) {
        setCompanyId(context.companyId);
        if (context.companyName) setCompanyName(context.companyName);

        const [custs, supps] = await Promise.all([
          getContactsUseCase.executeCustomers(context.companyId),
          getContactsUseCase.executeSuppliers(context.companyId),
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

  const totalSalesToCustomers = customers.reduce((acc, c) => acc + c.totalSpent, 0);
  const activeCustomersCount = customers.filter((c) => c.active).length;
  const totalPurchasesFromSuppliers = suppliers.reduce((acc, s) => acc + s.totalSpent, 0);
  const activeSuppliersCount = suppliers.filter((s) => s.active).length;

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
              <Users className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Clientes & Proveedores
            </h1>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Contacto</span>
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Total Clientes"
          value={customers.length.toString()}
          subtitle={`${activeCustomersCount} activos`}
          icon={Users}
        />
        <MetricCard
          title="Facturación Clientes"
          value={`$${totalSalesToCustomers.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle="Cobros y despachos"
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
          subtitle="Total abastecimiento"
          icon={Building2}
        />
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`px-3 py-1 rounded font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'CUSTOMERS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clientes ({customers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`px-3 py-1 rounded font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'SUPPLIERS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Proveedores ({suppliers.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, CUIT, email..."
            className="w-full h-8 pl-8 pr-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
          />
        </div>
      </div>

      {/* Tables based on Active Tab */}
      {activeTab === 'CUSTOMERS' ? (
        <CustomerTable
          customers={filteredCustomers}
          loading={loading}
          onToggleStatus={handleToggleCustomer}
          onOpenPayment={(c) => setPayingCustomer(c)}
          onOpenStatement={(c) => setStatementCustomer(c)}
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

      {/* Modal de Cobranza y Recibo A4 */}
      {payingCustomer && (
        <CustomerPaymentModal
          isOpen={!!payingCustomer}
          onClose={() => setPayingCustomer(null)}
          customer={payingCustomer}
          companyName={companyName}
          onPaymentSuccess={loadData}
        />
      )}

      {/* Modal de Estado de Cuenta Corriente A4 */}
      {statementCustomer && (
        <CustomerAccountStatementModal
          isOpen={!!statementCustomer}
          onClose={() => setStatementCustomer(null)}
          customer={statementCustomer}
          companyName={companyName}
          onOpenPayment={(c) => {
            setStatementCustomer(null);
            setPayingCustomer(c);
          }}
        />
      )}
    </div>
  );
}
