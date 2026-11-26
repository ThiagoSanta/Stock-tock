import React, { useEffect, useState, useMemo } from 'react';
import { Users, Truck, Plus, Search, DollarSign, Building2 } from 'lucide-react';
import { PageHeader, Button, Input } from '@/presentation/components/ui';
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
import { CustomerProfileModal } from '@/presentation/modules/contacts/CustomerProfileModal';
import { SupplierPaymentModal } from '@/presentation/modules/contacts/SupplierPaymentModal';
import { SupplierAccountStatementModal } from '@/presentation/modules/contacts/SupplierAccountStatementModal';
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
  const [profileCustomer, setProfileCustomer] = useState<CustomerWithMetrics | null>(null);
  const [payingSupplier, setPayingSupplier] = useState<SupplierWithMetrics | null>(null);
  const [statementSupplier, setStatementSupplier] = useState<SupplierWithMetrics | null>(null);
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
      <PageHeader
        title="Clientes & Proveedores"
        icon={<Users className="w-3.5 h-3.5" />}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4 text-lime-400 dark:text-lime-600" />}
          >
            Nuevo Contacto
          </Button>
        }
      />

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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-md text-xs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'CUSTOMERS'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clientes ({customers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'SUPPLIERS'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Proveedores ({suppliers.length})</span>
          </button>
        </div>

        <div className="w-full sm:w-72">
          <Input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, CUIT, email..."
            leftIcon={<Search className="w-3.5 h-3.5" />}
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
          onOpenProfile={(c) => setProfileCustomer(c)}
        />
      ) : (
        <SupplierTable
          suppliers={filteredSuppliers}
          loading={loading}
          onToggleStatus={handleToggleSupplier}
          onOpenPayment={(s) => setPayingSupplier(s)}
          onOpenStatement={(s) => setStatementSupplier(s)}
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

      {/* Modal de Cobranza y Recibo A4 Clientes */}
      {payingCustomer && (
        <CustomerPaymentModal
          isOpen={!!payingCustomer}
          onClose={() => setPayingCustomer(null)}
          customer={payingCustomer}
          companyName={companyName}
          onPaymentSuccess={loadData}
        />
      )}

      {/* Modal de Estado de Cuenta Corriente A4 Clientes */}
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

      {/* Modal de Ficha del Cliente */}
      {profileCustomer && (
        <CustomerProfileModal
          isOpen={!!profileCustomer}
          onClose={() => setProfileCustomer(null)}
          customer={profileCustomer}
          companyName={companyName}
          onOpenPayment={(c) => {
            setProfileCustomer(null);
            setPayingCustomer(c);
          }}
          onOpenStatement={(c) => {
            setProfileCustomer(null);
            setStatementCustomer(c);
          }}
        />
      )}

      {/* Modal de Orden de Pago A4 Proveedores */}
      {payingSupplier && (
        <SupplierPaymentModal
          isOpen={!!payingSupplier}
          onClose={() => setPayingSupplier(null)}
          supplier={payingSupplier}
          companyName={companyName}
          onPaymentSuccess={loadData}
        />
      )}

      {/* Modal de Estado de Cuenta Corriente A4 Proveedores */}
      {statementSupplier && (
        <SupplierAccountStatementModal
          isOpen={!!statementSupplier}
          onClose={() => setStatementSupplier(null)}
          supplier={statementSupplier}
          companyName={companyName}
          onOpenPayment={(s) => {
            setStatementSupplier(null);
            setPayingSupplier(s);
          }}
        />
      )}
    </div>
  );
}
