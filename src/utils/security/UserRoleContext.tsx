import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile, RolePermissions, ROLE_PERMISSIONS } from '@/core/domain/security/types';
import { AuditService } from '@/core/application/services/AuditService';
import { getCompanyContext } from '@/utils/supabase/companyContext';
import { useAuth } from '@/utils/security/AuthContext';

export const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'user-admin',
    name: 'Admin / Gerencia',
    role: 'ADMIN',
    email: 'gerencia@empresa.com',
    avatarColor: 'bg-slate-900',
  },
  {
    id: 'user-cashier-1',
    name: 'Cajero Mostrador (Turno 1)',
    role: 'CASHIER',
    email: 'caja1@empresa.com',
    avatarColor: 'bg-emerald-600',
  },
  {
    id: 'user-warehouse-1',
    name: 'Encargado Depósito Central',
    role: 'WAREHOUSE',
    email: 'deposito@empresa.com',
    avatarColor: 'bg-amber-600',
  },
];

interface UserRoleContextType {
  currentUser: UserProfile;
  permissions: RolePermissions;
  availableProfiles: UserProfile[];
  switchProfile: (profile: UserProfile) => Promise<void>;
  createProfile: (profile: Omit<UserProfile, 'id'>) => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const { user, membership } = useAuth();

  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('stocktock_user_profiles');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILES;
    } catch {
      return DEFAULT_PROFILES;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('stocktock_active_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = profiles.find((p) => p.id === parsed.id);
        if (match) return match;
      }
    } catch {
      // Fallback
    }
    return profiles[0] || DEFAULT_PROFILES[0];
  });

  // Sincronizar con el rol real verificado en base de datos cuando exista membresía
  useEffect(() => {
    if (user && membership) {
      const colorMap: Record<UserRole, string> = {
        ADMIN: 'bg-zinc-900',
        CASHIER: 'bg-emerald-600',
        WAREHOUSE: 'bg-amber-600',
      };
      setCurrentUser({
        id: user.id,
        name: membership.fullName || user.email || 'Operador',
        role: membership.role,
        email: user.email,
        avatarColor: colorMap[membership.role] || 'bg-zinc-900',
      });
    }
  }, [user, membership]);

  const permissions = ROLE_PERMISSIONS[currentUser.role] || ROLE_PERMISSIONS.CASHIER;

  const switchProfile = async (newProfile: UserProfile) => {
    const oldName = currentUser.name;
    const oldRole = currentUser.role;
    setCurrentUser(newProfile);
    try {
      localStorage.setItem('stocktock_active_profile', JSON.stringify(newProfile));
    } catch {
      // Silencioso
    }

    // Registrar cambio de turno u operador en Auditoría
    try {
      const companyCtx = await getCompanyContext();
      if (companyCtx?.companyId) {
        await AuditService.logAction({
          companyId: companyCtx.companyId,
          userName: newProfile.name,
          userRole: newProfile.role,
          module: 'SEGURIDAD',
          action: 'CAMBIO_OPERADOR_SESION',
          details: `Cambio de operador: "${oldName}" (${oldRole}) -> "${newProfile.name}" (${newProfile.role})`,
        });
      }
    } catch {
      // Silencioso
    }
  };

  const createProfile = (profileData: Omit<UserProfile, 'id'>) => {
    const newProfile: UserProfile = {
      ...profileData,
      id: `user-${Date.now().toString().slice(-6)}`,
    };
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    try {
      localStorage.setItem('stocktock_user_profiles', JSON.stringify(updated));
    } catch {
      // Silencioso
    }
  };

  return (
    <UserRoleContext.Provider
      value={{
        currentUser,
        permissions,
        availableProfiles: profiles,
        switchProfile,
        createProfile,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole debe utilizarse dentro de un UserRoleProvider');
  }
  return context;
}
