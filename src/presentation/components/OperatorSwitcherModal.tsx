import React, { useState } from 'react';
import { Shield, Plus, Check } from 'lucide-react';
import { useUserRole } from '@/utils/security/UserRoleContext';
import { UserRole } from '@/core/domain/security/types';
import { Modal, Button, Badge, Input, Select } from '@/presentation/components/ui';

interface OperatorSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OperatorSwitcherModal({ isOpen, onClose }: OperatorSwitcherModalProps) {
  const { currentUser, availableProfiles, switchProfile, createProfile } = useUserRole();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('CASHIER');

  const handleSelect = async (profile: any) => {
    await switchProfile(profile);
    onClose();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const colors: Record<UserRole, string> = {
      ADMIN: 'bg-zinc-900 dark:bg-zinc-700',
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Control de Operador & Rol Activo"
      icon={<Shield className="w-3.5 h-3.5" />}
      size="md"
    >
      <div className="p-4 space-y-4">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
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
                    ? 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-900 dark:border-lime-500/60 shadow-2xs'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full ${p.avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {p.name}
                      </span>
                      {isCurrent && (
                        <Badge variant="brand" mono>
                          ACTIVO
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium block truncate">
                      {p.role === 'ADMIN'
                        ? 'Administrador (Acceso total & Costos)'
                        : p.role === 'CASHIER'
                        ? 'Cajero / Ventas (Sin ver costos PPP)'
                        : 'Encargado de Depósito (Gestión de Stock)'}
                    </span>
                  </div>
                </div>

                {isCurrent ? (
                  <div className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-lime-400 text-white dark:text-zinc-950 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Formulario para agregar nuevo operador */}
        {showAddForm ? (
          <form
            onSubmit={handleCreate}
            className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-3"
          >
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider block">
              Nuevo Operador
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Input
                label="Nombre"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Sofía (Caja 2)"
              />

              <Select
                label="Rol Asignado"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
              >
                <option value="CASHIER">Cajero / Mostrador</option>
                <option value="WAREHOUSE">Encargado de Depósito</option>
                <option value="ADMIN">Administrador</option>
              </Select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Guardar Perfil
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full h-9 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white dark:bg-zinc-900"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dar de alta otro operador / turno</span>
          </button>
        )}
      </div>
    </Modal>
  );
}
