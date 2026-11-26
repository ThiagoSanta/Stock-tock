import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { invalidateCompanyContext } from '@/utils/supabase/companyContext';
import type { UserRole } from '@/core/domain/security/types';

interface AuthMembership {
  companyId: string;
  role: UserRole;
  fullName: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  membership: AuthMembership | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [membership, setMembership] = useState<AuthMembership | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMembership = async (currentUser: User | null) => {
    if (!currentUser) {
      setMembership(null);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('company_users')
        .select('company_id, role, full_name')
        .eq('user_id', currentUser.id)
        .eq('active', true)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setMembership({
          companyId: data.company_id,
          role: data.role as UserRole,
          fullName: data.full_name,
        });
      } else {
        setMembership(null);
      }
    } catch {
      // Si la tabla company_users aún no fue migrada, no bloquear el arranque
      setMembership(null);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      await loadMembership(data.session?.user ?? null);
      if (mounted) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      invalidateCompanyContext();
      await loadMembership(nextSession?.user ?? null);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(error.message);
    if (data.user) {
      try {
        await supabase.rpc('bootstrap_user_company', {
          p_full_name: data.user.user_metadata?.full_name || data.user.email || 'Administrador',
        });
      } catch {
        // Ignorar si la RPC aún no existe en la DB
      }
      await loadMembership(data.user);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    });
    if (error) throw new Error(error.message);

    const needsEmailConfirmation = !data.session;
    if (data.session && data.user) {
      try {
        await supabase.rpc('bootstrap_user_company', {
          p_full_name: fullName.trim() || 'Administrador',
        });
      } catch {
        // Ignorar si la RPC aún no existe en la DB
      }
      await loadMembership(data.user);
    }

    return { needsEmailConfirmation };
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    invalidateCompanyContext();
    setMembership(null);
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, membership, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return ctx;
}
