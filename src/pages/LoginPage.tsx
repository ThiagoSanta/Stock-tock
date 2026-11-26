import React, { useState } from 'react';
import { Lock, Mail, User, AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/utils/security/AuthContext';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        const res = await signUp(email, password, fullName);
        if (res.needsEmailConfirmation) {
          setSuccessMsg(
            'Cuenta creada. Revisá tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.'
          );
          setMode('login');
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de autenticación.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 font-sans">
      <div className="w-full max-w-sm rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg p-6 space-y-5">
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-lime-400 flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Stock<span className="text-lime-500 font-black">·</span>tock
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {mode === 'login'
              ? 'Ingresá con tu cuenta para operar el sistema'
              : 'Creá tu cuenta de administrador'}
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                Nombre completo
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-lime-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-lime-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-lime-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-lime-400 dark:hover:bg-lime-300 text-white dark:text-zinc-950 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
              setSuccessMsg(null);
            }}
            className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
          >
            {mode === 'login'
              ? '¿No tenés cuenta? Registrate acá'
              : '¿Ya tenés cuenta? Iniciá sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
