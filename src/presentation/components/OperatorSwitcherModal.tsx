import React, { useState } from 'react';
import { X, Shield, User, UserCheck, Plus, Check } from 'lucide-react';
import { useUserRole } from '@/utils/security/UserRoleContext';
import { UserRole } from '@/core/domain/security/types';

interface OperatorSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OperatorSwitcherModal({ isOpen, onClose }: OperatorSwitcherModalProps) {
  const { currentUser, availableProfiles, switchProfile, createProfile } = useUserRole();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('CASHIER');

  if (!isOpen) return null;

  const handleSelect = async (profile: any) => {
    await switchProfile(profile);
    onClose();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const colors: Record<UserRole, string> = {
      ADMIN: 'bg-slate-900',
      CASHIER: 'bg-emerald-600',
      WAREHOUSE: 'bg-amber-600',
    };

    createProfile({
      name: newName.trim(),
      role: newRole,
      avatarColor: colors[newRole],
    });

    setNewName('');
    setShowAddForm(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="operator-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white border border-slate-300 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <h3 id="operator-modal-title" className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Control de Operador & Rol Activo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-slate-600">
            Seleccioná el operador actual de este puesto de trabajo. Los permisos y vistas de costos se ajustan automáticamente según el perfil.
          </p>

          {/* Lista de Operadores Disponibles */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {availableProfiles.map((p) => {
              const isCurrent = p.id === currentUser.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-50 border-slate-900 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full ${p.avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-900">{p.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-slate-900 bg-slate-200/80 px-1.5 py-0.2 rounded font-mono">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {p.role === 'ADMIN'
                          ? 'Administrador (Acceso total & Costos)'
                          : p.role === 'CASHIER'
                          ? 'Cajero / Ventas (Sin ver costos PPP)'
                          : 'Encargado de Depósito (Gestión de Stock)'}
                      </span>
                    </div>
                  </div>

                  {isCurrent ? (
                    <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Formulario para agregar nuevo operador */}
          {showAddForm ? (
            <form onSubmit={handleCreate} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-800 uppercase block">
                Nuevo Operador
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Nombre</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej: Sofía (Caja 2)"
                    className="w-full h-7 px-2 rounded bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Rol Asignado</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full h-7 px-1.5 rounded bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    <option value="CASHIER">Cajero / Mostrador</option>
                    <option value="WAREHOUSE">Encargado de Depósito</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="h-6 px-2.5 rounded text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-6 px-3 rounded bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                >
                  Guardar Perfil
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full h-8 rounded-lg border border-dashed border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dar de alta otro operador / turno</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
