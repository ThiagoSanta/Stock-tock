import React, { useState } from 'react';
import { X, Users, Truck, AlertCircle } from 'lucide-react';
import { CreateCustomerDTO } from '@/core/application/use-cases/contacts/CreateCustomerUseCase';
import { CreateSupplierDTO } from '@/core/application/use-cases/contacts/CreateSupplierUseCase';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'CUSTOMER' | 'SUPPLIER';
  companyId: string;
  onCreateCustomer: (dto: CreateCustomerDTO) => Promise<void>;
  onCreateSupplier: (dto: CreateSupplierDTO) => Promise<void>;
}

export function ContactModal({
  isOpen,
  onClose,
  defaultType = 'CUSTOMER',
  companyId,
  onCreateCustomer,
  onCreateSupplier,
}: ContactModalProps) {
  const [contactType, setContactType] = useState<'CUSTOMER' | 'SUPPLIER'>(defaultType);
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [creditLimit, setCreditLimit] = useState('0');
  const [priceList, setPriceList] = useState<'MINORISTA' | 'MAYORISTA' | 'GREMIO'>('MINORISTA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre o razón social es obligatorio.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (contactType === 'CUSTOMER') {
        await onCreateCustomer({
          companyId,
          name,
          taxId,
          email,
          phone,
          address,
          notes,
          creditLimit: parseFloat(creditLimit) || 0,
          priceList,
          active: true,
        });
      } else {
        await onCreateSupplier({
          companyId,
          name,
          taxId,
          contactName,
          email,
          phone,
          address,
          notes,
          active: true,
        });
      }

      onClose();
      setName('');
      setTaxId('');
      setContactName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setNotes('');
      setCreditLimit('0');
      setPriceList('MINORISTA');
    } catch (err: any) {
      setError(err.message || 'Error al guardar el contacto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg w-full max-w-lg overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-100 text-slate-800 flex items-center justify-center">
              {contactType === 'CUSTOMER' ? <Users className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
            </div>
            <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
              {contactType === 'CUSTOMER' ? 'Nuevo Cliente' : 'Nuevo Proveedor'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contact Type Switcher */}
        <div className="px-4 pt-3">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-md border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setContactType('CUSTOMER')}
              className={`py-1 rounded font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                contactType === 'CUSTOMER'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Cliente
            </button>
            <button
              type="button"
              onClick={() => setContactType('SUPPLIER')}
              className={`py-1 rounded font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                contactType === 'SUPPLIER'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" /> Proveedor
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Nombre / Razón Social <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={contactType === 'CUSTOMER' ? 'Ej: Distribuidora Sur S.A.' : 'Ej: Bodega Catena Zapata'}
              className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                {contactType === 'CUSTOMER' ? 'DNI / CUIT' : 'CUIT Fiscal'}
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="Ej: 30-71123456-8"
                className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
            {contactType === 'SUPPLIER' ? (
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Persona de Contacto
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ej: Laura Gómez"
                  className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 11 4455-6677"
                  className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@empresa.com"
                className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
            {contactType === 'SUPPLIER' ? (
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 11 4455-6677"
                  className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Corrientes 1234"
                  className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>
            )}
          </div>

          {contactType === 'CUSTOMER' && (
            <div className="grid grid-cols-2 gap-3 p-2.5 rounded bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Límite de Crédito ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="0 = Sin límite"
                  className="w-full h-8 px-2.5 rounded bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">0 = Sin límite fijado</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Lista de Precios Asignada
                </label>
                <select
                  value={priceList}
                  onChange={(e) => setPriceList(e.target.value as any)}
                  className="w-full h-8 px-2 rounded bg-white border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-slate-900"
                >
                  <option value="MINORISTA">Lista 1: Minorista / Mostrador</option>
                  <option value="MAYORISTA">Lista 2: Mayorista / Distribuidor</option>
                  <option value="GREMIO">Lista 3: Gremio / Técnico</option>
                </select>
                <span className="text-[10px] text-slate-500 block mt-0.5">Se aplica por defecto en POS</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Notas u Observaciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Condiciones comerciales acordadas..."
              className="w-full p-2 rounded bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-8 px-3 rounded bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-8 px-4 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? 'Guardando...' : `Guardar ${contactType === 'CUSTOMER' ? 'Cliente' : 'Proveedor'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
