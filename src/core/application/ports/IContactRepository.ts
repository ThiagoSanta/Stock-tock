import { Customer, CustomerWithMetrics, Supplier, SupplierWithMetrics } from '@/core/domain/contacts/types';

export interface IContactRepository {
  getCustomers(companyId: string): Promise<CustomerWithMetrics[]>;
  getSuppliers(companyId: string): Promise<SupplierWithMetrics[]>;
  createCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer>;
  createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier>;
  toggleCustomerStatus(id: string, active: boolean): Promise<void>;
  toggleSupplierStatus(id: string, active: boolean): Promise<void>;
}
