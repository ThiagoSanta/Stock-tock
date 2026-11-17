'use client';

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
    } catch (err: any) {
      setError(err.message || 'Error al guardar el contacto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222226]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
              {contactType === 'CUSTOMER' ? <Users className="w-5 h-5" /> : <Truck className="w-5 h-5 text-[#84cc16]" />}
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm">
                {contactType === 'CUSTOMER' ? 'Nuevo Cliente' : 'Nuevo Proveedor'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {contactType === 'CUSTOMER' ? 'Registrar cliente o cuenta comercial' : 'Registrar proveedor o fabricante'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contact Type Switcher */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 bg-[#18181b] rounded-lg border border-[#27272a]">
            <button
              type="button"
              onClick={() => setContactType('CUSTOMER')}
              className={`py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                contactType === 'CUSTOMER'
                  ? 'bg-zinc-800 text-zinc-100 shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Cliente
            </button>
            <button
              type="button"
              onClick={() => setContactType('SUPPLIER')}
              className={`py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                contactType === 'SUPPLIER'
                  ? 'bg-zinc-800 text-[#84cc16] shadow font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" /> Proveedor
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Nombre / Razón Social <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={contactType === 'CUSTOMER' ? 'Ej: Distribuidora Sur S.A.' : 'Ej: Bodega Catena Zapata'}
              className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                {contactType === 'CUSTOMER' ? 'DNI / CUIT' : 'CUIT Fiscal'}
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="Ej: 30-71123456-8"
                className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
              />
            </div>
            {contactType === 'SUPPLIER' ? (
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Persona de Contacto
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ej: Laura Gómez (Ventas)"
                  className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: +54 9 11 4455-6677"
                  className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@empresa.com"
                className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
              />
            </div>
            {contactType === 'SUPPLIER' ? (
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: +54 9 11 4455-6677"
                  className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Dirección de Entrega
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Corrientes 1234, CABA"
                  className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
                />
              </div>
            )}
          </div>

          {contactType === 'SUPPLIER' && (
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Dirección / Depósito Proveedor
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ruta 7 Km 1000, Mendoza"
                className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Notas u Observaciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Condiciones comerciales acordadas, días de entrega preferidos..."
              className="w-full p-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222226]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#84cc16] text-black hover:bg-[#9ae624] transition-colors flex items-center gap-1.5"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />}
              <span>Guardar {contactType === 'CUSTOMER' ? 'Cliente' : 'Proveedor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
