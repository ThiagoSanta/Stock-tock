import { createClient } from '@/utils/supabase/client';
import { Customer, CustomerWithMetrics, Supplier, SupplierWithMetrics } from '@/core/domain/contacts/types';
import { IContactRepository } from '@/core/application/ports/IContactRepository';

export class SupabaseContactRepository implements IContactRepository {
  private supabase = createClient();

  async getCustomers(companyId: string): Promise<CustomerWithMetrics[]> {
    const { data: customersData, error: custErr } = await this.supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (custErr) throw new Error(custErr.message);

    // Fetch sales grouped by customer to calculate metrics
    const { data: salesData, error: salesErr } = await this.supabase
      .from('sales')
      .select('customer_id, total_amount, created_at')
      .eq('company_id', companyId)
      .not('customer_id', 'is', null);

    if (salesErr) console.warn('Warning fetching customer sales metrics:', salesErr);

    const salesList = salesData || [];

    return (customersData || []).map((c: any) => {
      const customerSales = salesList.filter((s: any) => s.customer_id === c.id);
      const totalOrdersCount = customerSales.length;
      const totalSpent = customerSales.reduce((acc: number, s: any) => acc + Number(s.total_amount || 0), 0);
      const lastPurchaseDate = customerSales.length > 0
        ? customerSales.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : undefined;

      return {
        id: c.id,
        companyId: c.company_id,
        name: c.name,
        taxId: c.tax_id || undefined,
        email: c.email || undefined,
        phone: c.phone || undefined,
        address: c.address || undefined,
        notes: c.notes || undefined,
        active: c.active ?? true,
        createdAt: c.created_at,
        totalOrdersCount,
        totalSpent,
        lastPurchaseDate,
      };
    });
  }

  async getSuppliers(companyId: string): Promise<SupplierWithMetrics[]> {
    const { data: suppliersData, error: suppErr } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (suppErr) throw new Error(suppErr.message);

    // Fetch purchases to calculate metrics
    const { data: purchasesData, error: purchErr } = await this.supabase
      .from('purchases')
      .select('supplier_id, total_amount, created_at, status')
      .eq('company_id', companyId)
      .not('supplier_id', 'is', null);

    if (purchErr) console.warn('Warning fetching supplier purchases metrics:', purchErr);

    const purchasesList = purchasesData || [];

    return (suppliersData || []).map((s: any) => {
      const supplierPurchases = purchasesList.filter((p: any) => p.supplier_id === s.id);
      const totalPurchasesCount = supplierPurchases.length;
      const totalSpent = supplierPurchases.reduce((acc: number, p: any) => acc + Number(p.total_amount || 0), 0);
      const lastPurchaseDate = supplierPurchases.length > 0
        ? supplierPurchases.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : undefined;

      return {
        id: s.id,
        companyId: s.company_id,
        name: s.name,
        taxId: s.tax_id || undefined,
        contactName: s.contact_name || undefined,
        email: s.email || undefined,
        phone: s.phone || undefined,
        address: s.address || undefined,
        notes: s.notes || undefined,
        active: s.active ?? true,
        createdAt: s.created_at,
        totalPurchasesCount,
        totalSpent,
        lastPurchaseDate,
      };
    });
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const { data, error } = await this.supabase
      .from('customers')
      .insert({
        company_id: customer.companyId,
        name: customer.name,
        tax_id: customer.taxId || null,
        email: customer.email || null,
        phone: customer.phone || null,
        address: customer.address || null,
        notes: customer.notes || null,
        active: customer.active,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      companyId: data.company_id,
      name: data.name,
      taxId: data.tax_id || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      notes: data.notes || undefined,
      active: data.active,
      createdAt: data.created_at,
    };
  }

  async createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .insert({
        company_id: supplier.companyId,
        name: supplier.name,
        tax_id: supplier.taxId || null,
        contact_name: supplier.contactName || null,
        email: supplier.email || null,
        phone: supplier.phone || null,
        address: supplier.address || null,
        notes: supplier.notes || null,
        active: supplier.active,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      companyId: data.company_id,
      name: data.name,
      taxId: data.tax_id || undefined,
      contactName: data.contact_name || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      notes: data.notes || undefined,
      active: data.active,
      createdAt: data.created_at,
    };
  }

  async toggleCustomerStatus(id: string, active: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('customers')
      .update({ active })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async toggleSupplierStatus(id: string, active: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('suppliers')
      .update({ active })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
